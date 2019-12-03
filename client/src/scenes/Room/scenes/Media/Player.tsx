import React, { useState, useRef, useEffect, Dispatch, Component } from 'react';
import ReactRedux, { connect, MapStateToProps } from 'react-redux';
import ReactPlayer from 'react-player';
import cn from 'classnames';
import { get } from 'lodash';
import * as types from '../../../../constants/actionTypes';
import { formatTime, requestFullscreen } from '../../../../utils';
import { PLAYER_MINIMIZE_TIMEOUT, MAX_VIDEO_SYNC_OFFSET } from '../../../../constants';
import * as api from '../../../../constants/apiActions'
import PlayerGlobalControls from './components/PlayerGlobalControls'
import PlayerGlobalMessages from './components/PlayerMessages'

import ProgressBar from './components/ProgressBar';
import Subtitles from './components/Subtitles';
import { playerConf } from '../../../../conf';
import { Video } from '../../../../utils/types';
import { Media } from '../../../../reducers/media';
import { webSocketSend } from '../../../../actions';
import PlayerUI from './components/PlayerUI';
import { PermissionsMap, Permissions } from '../../../../reducers/rooms';

let minimizeTimer = null;
let remoteControlTimeRewind = null;
let remoteControlTimePlayback = null;
let videoEl = null;

interface PlayerProps {
    media: Media;
    playlist: Video[];
    remotePlaying: boolean;
    cinemaMode: boolean;
    permissionLevel: PermissionsMap;
    currentPermissions: Permissions;
    updatePlayer: (payload: any) => void;
    resetMedia: () => void;
    switchMute: () => void;
    setVolume: (payload: any) => void;
    toggleCinemaMode: () => void;
    toggleSync: () => void;
    toggleSubs: () => void;
    getSubs: (payload: any) => void;
    hideSubs: () => void;
}

function Player(props: PlayerProps) {
    const [minimized, setMinimized] = useState(false);
    const [synced, setSynced] = useState(true);
    const [playing, setPlaying] = useState(true);
    const [remoteControlRewind, setRemoteControlRewind] = useState(false)
    const [remoteControlPlaying, setRemoteControlPlaying] = useState(false)
    // We only use currentTime to update player time.
    // In other case we get time directly from video element.
    const [currentTime, setCurrentTime] = useState(0);
    const lastTime = useRef(0);
    const minimizedRef = useRef(false);
    const playerRef = useRef(null);

    let volume = 0.3;

    useEffect(() => {
        init();

        return () => {
            resetRefs();
            props.resetMedia();
        };
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mediaafterchange', watchPlaylist);
        document.addEventListener('mediabeforechange', beforeMediaChange);

        return () => {
            clearTimeout(remoteControlTimeRewind)
            clearTimeout(remoteControlTimePlayback)
            clearTimeout(minimizeTimer)
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mediaafterchange', watchPlaylist);
            document.removeEventListener('mediabeforechange', beforeMediaChange);
        }
    }, []);

    useEffect(() => { syncWithRemote() }, [props.media.actualTime, props.media.remotePlaying, synced]);

    useEffect(() => {
        requestAnimationFrame(() => { lastTime.current = currentTime })
        if (Math.abs(currentTime - lastTime.current) < 7) return
        if (Math.abs(props.media.actualTime - currentTime) < 7) return
        if (props.media.actualTime < 1) return
        if (lastTime.current < 1) return
        onProgressChangeLazy()

    }, [currentTime]);

    function beforeMediaChange() {
        // We're doing it so onProgressChangeLazy does not trigger on media change
        setCurrentTime(0)
    }

    // useEffect(() => { console.log(props.media.actualTime); }, [props.media.actualTime]);

    function watchPlaylist({ detail }: CustomEvent) {
        const liveStream = get(detail, 'mediaAfter.live_stream') as boolean;
        const iframe = get(detail, 'mediaAfter.iframe') as boolean;


        if (!liveStream && !iframe) {
            // setTimeout(() => {
            safelySeekTo(0);
            // }, 0);
            setSynced(true);
        }
        props.hideSubs();
    }

    function resetRefs() {
        videoEl = null;
    }

    function init() {
        // TODO: fix volume parser later
        try {
            const { updatePlayer } = props;
            // eslint-disable-next-line prefer-destructuring
            volume = localStorage.volume;
            volume = JSON.parse(volume as any || 1);
            updatePlayer({ volume });
        } catch (error) { return }
    }

    function handleReady() {
        updateTime();
        // handleMouseMove();
    }

    function updateTime() {
        const [duration, curTime] = safelyGetTimeAndDuration();
        videoEl = playerRef.current.getInternalPlayer();
        props.updatePlayer({ duration });
        setCurrentTime(curTime);
    }

    function safelyGetTimeAndDuration(): [number, number] {
        try {
            const duration = playerRef.current.getDuration() as number;
            const curTime = playerRef.current.getCurrentTime() as number;
            return [duration, curTime]
        } catch (error) {
            return [0, 0]
        }
    }

    function safelySeekTo(n: number, type = 'seconds') {
        try {
            playerRef.current.seekTo(n, type);
        } catch (error) { return; }
    }

    function syncWithRemote() {
        if (!synced) return;
        const { actualTime, remotePlaying } = props.media;

        const shouldSeek = Math.abs(actualTime - currentTime) > MAX_VIDEO_SYNC_OFFSET;

        if (shouldSeek) safelySeekTo(actualTime);

        if (remotePlaying) setPlaying(true)
        if (!remotePlaying) setPlaying(false)
    }

    function handlePlaying({ playedSeconds }) {
        setCurrentTime(playedSeconds)
    }

    function handleMouseMove({ target }) {
        clearTimeout(minimizeTimer);
        if (target.closest('.video-player')) return;
        if (minimizedRef.current) return;
        minimizeTimer = setTimeout(setMinimizedTrue, PLAYER_MINIMIZE_TIMEOUT);
    }

    function setMinimizedFalse() {
        minimizedRef.current = false;
        setMinimized(false)
    }

    function setMinimizedTrue() {
        minimizedRef.current = true;
        setMinimized(true)
    }

    const handlePlay = () => {
        if (!playing) setPlaying(true)
        handleAutoRemoteControl()
        // setRemoteControlPlaying(true)
        // const e = new Event('videoplay');
        // document.dispatchEvent(e);
    };
    const handlePause = () => {
        if (playing) setPlaying(false)
        setSynced(false)
        handleAutoRemoteControl()
        // setRemoteControlPlaying(true)
        // const e = new Event('videopause');
        // document.dispatchEvent(e);
    };

    function getCurrentVideo(): Video {
        return get(props.playlist, '[0]')
    }

    function getNextVideo(): Video {
        return get(props.playlist, '[1]')
    }

    function getCurrentUrl() {
        const currentVideo = getCurrentVideo();
        return get(currentVideo, 'url') || '';
    }

    function isDirect() {
        const currentVideo = getCurrentVideo();
        return get(currentVideo, 'direct') || false;
    }

    function isIframe() {
        const currentVideo = getCurrentVideo();
        return get(currentVideo, 'iframe') || false;
    }

    function RenderPlayer() {
        const { media, permissionLevel, currentPermissions } = props;
        const url = getCurrentUrl();
        const nextVideo = getNextVideo();
        const direct = isDirect();
        const iframe = isIframe();
        return (
            <React.Fragment>
                {!iframe && <ReactPlayer
                    autoPlay
                    className="player-inner"
                    config={playerConf}
                    controls={!direct}
                    height=""
                    loop={false}
                    muted={media.muted}
                    onPause={handlePause}
                    onPlay={handlePlay}
                    onProgress={handlePlaying}
                    onReady={handleReady}
                    playing={playing}
                    progressInterval={300}
                    ref={playerRef}
                    url={url}
                    volume={media.volume}
                    width="100%"
                />}
                {iframe &&
                    <div dangerouslySetInnerHTML={{ __html: url }} style={{ width: '100%' }} className="player-inner" />
                }
                {isDirectLink() && <div className="video-overlay" />}
                <PlayerGlobalMessages remotelyPaused={!media.remotePlaying} />
                <PlayerGlobalControls
                    onToggleSync={toggleSynced}
                    synced={synced}
                    showRemoteRewind={remoteControlRewind}
                    showRemotePlayback={remoteControlPlaying}
                    onRemoteRewind={handleRemoteRewind}
                    onRemotePlaying={handleRemotePlaybackChange}
                    playing={playing}
                    remotePlaying={props.remotePlaying}
                />
                {<PreloadMedia nextVideo={nextVideo} />}
            </React.Fragment>
        );
    }

    function handleRemoteRewind() {
        const [_, time] = safelyGetTimeAndDuration()
        webSocketSend(api.REWIND_MEDIA({ time }), 'ticker')
            .then(() => setSynced(true))

        setRemoteControlRewind(false);
    }

    function handleRemotePlaybackChange() {
        const afterPause = () => {
            setSynced(true)
            setPlaying(false)
        }

        const afterResume = () => {
            setSynced(true)
            setPlaying(true)
        }

        if (playing) {
            webSocketSend(api.RESUME_MEDIA(), 'resume')
                .then(afterResume)
        } else {
            webSocketSend(api.PAUSE_MEDIA(), 'pause')
                .then(afterPause)
        }

        // setRemoteControlPlaying(false)
    }

    function handleProgressChange(percent: number) {
        safelySeekTo(percent / 100, 'fraction')
    }

    function onProgressChangeLazy() {
        if (synced) {
            setSynced(false);
        }

        handleRewinded()
    }

    function handleRewinded() {
        setRemoteControlRewind(true);
        clearTimeout(remoteControlTimeRewind)
        remoteControlTimeRewind = setTimeout(() => setRemoteControlRewind(false), 5000);
    }

    function toggleSynced() {
        setSynced(!synced)
        // if (!synced) safelySeekTo(props.media.actualTime);
    }

    function togglePlay() {
        if (synced) {
            setSynced(false);
        }

        setPlaying(!playing);

        // handleAutoRemoteControl()
    }

    function handleAutoRemoteControl() {
        if (!remoteControlPlaying) {
            setRemoteControlPlaying(true)
        }
        
        clearTimeout(remoteControlTimePlayback)
        remoteControlTimePlayback = setTimeout(() => setRemoteControlPlaying(false), 5000);
    }


    function toggleSubs() {
        props.toggleSubs();
    }


    function handleVolumeChange(percent) {
        props.setVolume(percent / 100);
    }

    function isDirectLink() {
        return getCurrentVideo() && getCurrentVideo().direct;
    }

    const classes = cn([
        'video-element',
        {
            'player-minimized': minimized,
            'player-maximized': !minimized,
            'player-raw': isDirectLink(),
            'player-embed': !isDirectLink(),
        },
    ]);
    const hasVideo = getCurrentVideo();
    return (
        <div
            onMouseLeave={setMinimizedTrue}
            onMouseMove={setMinimizedFalse}
            className={classes}
        >
            {RenderPlayer()}
            {isDirectLink() && hasVideo && playerRef.current &&
                <PlayerUI
                    synced={synced}
                    playing={playing}
                    hasSubs={!!props.media.subs.raw}
                    showSubs={props.media.showSubs}
                    remotePlaying={props.media.remotePlaying}
                    videoEl={playerRef.current.getInternalPlayer()}
                    duration={props.media.duration}
                    currentTime={currentTime}
                    remoteControlPlaying={remoteControlPlaying}
                    remoteControlRewind={remoteControlRewind}
                    minimized={minimized}
                    onToggleSubs={toggleSubs}
                    onTogglePlay={togglePlay}
                    onToggleSynced={toggleSynced}
                    muted={props.media.muted}
                    onToggleMute={props.switchMute}
                    volume={props.media.volume}
                    onProgressChange={handleProgressChange}
                    onVolumeChange={handleVolumeChange}
                />}
        </div>
    );
}


function PreloadMedia({ nextVideo }: { nextVideo: Video | null }) {
    if (!nextVideo) return null;
    if (nextVideo.iframe) return null;

    return (
        <ReactPlayer
            className="preload-player"
            width="0px"
            height="0px"
            // TODO: Maybe just set to display: none?
            style={{ visibility: 'hidden', display: 'none' }}
            config={playerConf}
            controls={false}
            loop={false}
            progressInterval={10000}
            muted={true}
            playing={false}
            volume={0}
            url={nextVideo.url}
        />
    );
}

const mapStateToProps = (state: any): ReactRedux.MapStateToProps<any, any, any> => ({
    media: state.media as Media,
    playlist: (state.media as Media).playlist,
    remotePlaying: (state.media as Media).remotePlaying,
    cinemaMode: state.mainStates.cinemaMode,
    permissionLevel: state.profile.currentLevel,
    currentPermissions: state.rooms.currentPermissions,
} as any);

const mapDispatchToProps = {
    updatePlayer: (payload: any) => ({ type: types.UPDATE_MEDIA, payload }),
    resetMedia: () => ({ type: types.RESET_MEDIA }),
    switchMute: () => ({ type: types.SWITCH_MUTE }),
    setVolume: (payload: any) => ({ type: types.SET_VOLUME, payload }),
    toggleCinemaMode: () => ({ type: types.TOGGLE_CINEMAMODE }),
    toggleSync: () => ({ type: types.TOGGLE_SYNC }),
    hideSubs: () => ({ type: types.HIDE_SUBS }),
    toggleSubs: () => ({ type: types.TOGGLE_SUBS }),
} as any;

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Player);

// export default Player;
// export default createConsumer(Player);

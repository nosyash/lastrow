import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import ReactPlayer from 'react-player';
import cn from 'classnames';
import { get } from 'lodash';
import * as types from '../../../../constants/actionTypes';
import { PLAYER_MINIMIZE_TIMEOUT, MAX_VIDEO_SYNC_OFFSET } from '../../../../constants';
import * as api from '../../../../constants/apiActions'
import PlayerGlobalControls from './components/PlayerGlobalControls'
import PlayerGlobalMessages from './components/PlayerMessages'
import { playerConf } from '../../../../conf';
import { Video } from '../../../../utils/types';
import { Media } from '../../../../reducers/media';
import { webSocketSend } from '../../../../actions';
import PlayerUI from './components/PlayerUI';
import { State } from '../../../../reducers';
import { ControlPanelEvent } from '../../../../components/ControlPanel';

let minimizeTimer = null;
const remoteControlTimeRewind = null;
let remoteControlTimePlayback = null;

interface PlayerProps {
    media: Media;
    playlist: Video[];
    remotePlaying: boolean;
    cinemaMode: boolean;
    isSynced: boolean;
    updatePlayer: (payload: any) => void;
    resetMedia: () => void;
    switchMute: () => void;
    setVolume: (payload: any) => void;
    toggleCinemaMode: () => void;
    toggleSync: () => void;
    setSync: (state: boolean) => void;
    toggleSubs: () => void;
    hideSubs: () => void;
}

function Player(props: PlayerProps) {
    const [minimized, setMinimized] = useState(false);
    const [playing, setPlaying] = useState(true);

    const [remoteControlRewind, setRemoteControlRewind] = useState(false)
    const [remoteControlPlaying, setRemoteControlPlaying] = useState(false)

    // We only use currentTime to update time in player user interface.
    // In other cases we get time directly from video element for perfomance reason
    const [currentTime, setCurrentTime] = useState(0);

    const minimizedRef = useRef(false);
    const playerRef = useRef(null);


    useEffect(() => {
        return () => {
            props.resetMedia();
        };
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
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

    // mutable listeners! must be removed and added on each corresponding state change
    useEffect(() => {
        document.addEventListener('controlPanelEvent', handleControlPanelAction);

        return () => {
            document.removeEventListener('controlPanelEvent', handleControlPanelAction);
        }
    }, [props.isSynced, playing, currentTime])

    function handleControlPanelAction({ detail }: CustomEvent<ControlPanelEvent>) {
        if (detail.toggleRemotePlayback) handleRemotePlaybackChange()
        if (detail.remotelyRewind) handleRemoteRewind()
    }

    useEffect(() => { syncRemoteStates() }, [currentTime, props.media.actualTime, props.media.remotePlaying, props.isSynced]);

    function beforeMediaChange() {
        // We're doing it so onProgressChangeLazy does not trigger on media change
        setCurrentTime(0)
    }


    function watchPlaylist({ detail }: CustomEvent) {
        const liveStream = get(detail, 'mediaAfter.live_stream') as boolean;
        const iframe = get(detail, 'mediaAfter.iframe') as boolean;


        if (!liveStream && !iframe) {
            safelySeekTo(0);
            props.setSync(true);
        }
        props.hideSubs();
    }

    function handleReady(): void {
        updateTime();
    }

    function updateTime(): void {
        const [duration, curTime] = safelyGetDurationAndTime();
        props.updatePlayer({ duration });
        setCurrentTime(curTime);
    }

    function safelyGetDurationAndTime(): [number, number] {
        try {
            const duration = playerRef.current.getDuration() as number;
            const curTime = playerRef.current.getCurrentTime() as number;
            return [duration, curTime]
        } catch (_) {
            return [0, 0]
        }
    }

    function safelySeekTo(n: number, type = 'seconds'): void {
        try {
            playerRef.current.seekTo(n, type);
        } catch (_) {
            return
        }
    }

    function syncRemoteStates() {
        if (!props.isSynced) {
            return;
        }

        const { remotePlaying, actualTime } = props.media
        const shouldSeek = Math.abs(actualTime - currentTime) > MAX_VIDEO_SYNC_OFFSET;
        const shouldTogglePlaying = playing !== remotePlaying

        if (shouldSeek) {
            safelySeekTo(actualTime);
        }

        if (shouldTogglePlaying) {
            setPlaying(remotePlaying)
        }
    }

    function handlePlaying({ playedSeconds }) {
        setCurrentTime(playedSeconds)
    }

    function handleMouseMove({ target }): void {
        clearTimeout(minimizeTimer);

        if (target.closest('.video-player') || minimizedRef.current) {
            return;
        }

        minimizeTimer = setTimeout(setMinimizedTrue, PLAYER_MINIMIZE_TIMEOUT);
    }

    function setMinimizedFalse(): void {
        minimizedRef.current = false;
        setMinimized(false)
    }
    function setMinimizedTrue(): void {
        minimizedRef.current = true;
        setMinimized(true)
    }

    function handlePlay(): void {
        setPlaying(true)


        handleAutoRemoteControl()
    }
    function handlePause(): void {
        setPlaying(false)

        handleAutoRemoteControl()
    }

    const getCurrentVideo = () => get(props.playlist, '[0]') as Video
    const getNextVideo = () => get(props.playlist, '[1]') as Video
    const getCurrentUrl = () => get(getCurrentVideo(), 'url', '')
    const isDirect = () => get(getCurrentVideo(), 'direct', false)
    const isIframe = () => get(getCurrentVideo(), 'iframe', false)

    function RenderPlayer() {
        const { media } = props;
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
                    onToggleSync={props.toggleSync}
                    synced={props.isSynced}
                    hasVideo={!!url}
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
        const [, time] = safelyGetDurationAndTime()
        webSocketSend(api.REWIND_MEDIA({ time }), 'ticker')
            .then(() => props.setSync(true))

        setRemoteControlRewind(false);
    }

    function handleRemotePlaybackChange() {
        const afterPause = () => {
            props.setSync(true)
            setPlaying(false)
        }

        const afterResume = () => {
            props.setSync(true)
            setPlaying(true)
        }
        
        if (!playing) {
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

    // function onProgressChangeLazy() {
    //     if (synced) {
    //         setSynced(false);
    //     }

    //     handleRewinded()
    // }

    // function handleRewinded() {
    //     setRemoteControlRewind(true);
    //     clearTimeout(remoteControlTimeRewind)
    //     remoteControlTimeRewind = setTimeout(() => setRemoteControlRewind(false), 5000);
    // }

    function toggleSynced() {
        // if (!synced) safelySeekTo(props.media.actualTime);
    }

    function togglePlay() {
        if (props.isSynced) {
            // setSynced(false);
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

    const volumeSaveThrottle = useRef(null)
    function handleVolumeChange(percent) {
        clearTimeout(volumeSaveThrottle.current)
        props.setVolume(percent / 100);

        volumeSaveThrottle.current = setTimeout(() => {
            localStorage.volume = JSON.stringify(percent / 100)
        }, 500);
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
                    synced={props.isSynced}
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
    if (!nextVideo || nextVideo.iframe) {
        return null;
    }

    return (
        <ReactPlayer
            className="preload-player"
            width="0px"
            height="0px"
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

const mapStateToProps = (state: State) => ({
    media: state.media,
    playlist: state.media.playlist,
    remotePlaying: state.media.remotePlaying,
    cinemaMode: state.mainStates.cinemaMode,
    isSynced: state.media.isSynced,
});

const mapDispatchToProps = {
    updatePlayer: (payload: any) => ({ type: types.UPDATE_MEDIA, payload }),
    resetMedia: () => ({ type: types.RESET_MEDIA }),
    switchMute: () => ({ type: types.SWITCH_MUTE }),
    setVolume: (payload: any) => ({ type: types.SET_VOLUME, payload }),
    toggleCinemaMode: () => ({ type: types.TOGGLE_CINEMAMODE }),
    toggleSync: () => ({ type: types.TOGGLE_SYNC }),
    setSync: (payload: boolean) => ({ type: types.SET_SYNC, payload }),
    hideSubs: () => ({ type: types.HIDE_SUBS }),
    toggleSubs: () => ({ type: types.TOGGLE_SUBS }),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Player);

import React, { useState, useRef, useEffect, Dispatch } from 'react';
import ReactRedux, { connect, MapStateToProps } from 'react-redux';
import ReactPlayer from 'react-player';
import cn from 'classnames';
import Redux from 'redux';
import { get } from 'lodash';
import * as types from '../../../../constants/actionTypes';
import { formatTime, requestFullscreen } from '../../../../utils';
import { PLAYER_MINIMIZE_TIMEOUT, MAX_VIDEO_SYNC_OFFSET } from '../../../../constants';

import ProgressBar from './components/ProgressBar';
import Subtitles from './components/Subtitles';
import { playerConf } from '../../../../conf';
import { Video } from '../../../../utils/types';
import { Media } from '../../../../reducers/media';

let minimizeTimer = null;
let prefetchWatcher = null;
let videoEl = null;

interface PlayerProps {
    media: Media;
    playlist: Video[];
    playing: boolean;
    cinemaMode: boolean;
    updatePlayer: (payload: any) => void;
    resetMedia: () => void;
    setPlaying: () => void;
    switchPlay: () => void;
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
    const [buffered, setBuffered] = useState([]);
    const [synced, setSynced] = useState(true);
    const minimizedRef = useRef(false);
    const playerRef = useRef(null);
    const currentVideoRef = useRef(null);
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

        return () => {
            clearInterval(prefetchWatcher);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mediaafterchange', watchPlaylist);
        }
    }, []);

    useEffect(() => { checkDelay() }, [props.media.actualTime]);

    function watchPlaylist({ detail }: CustomEvent) {
        const liveStream = get(detail, 'mediaAfter.live_stream') as boolean;
        const iframe = get(detail, 'mediaAfter.iframe') as boolean;

        if (!liveStream && !iframe) {
            safelySeekTo(0);
            setSynced(true);
        }
        props.hideSubs();
    }

    function waitForPrefetch() {
        clearInterval(prefetchWatcher);
        prefetchWatcher = setInterval(() => {
            if (!playerRef) return;
            const [duration, currentTime] = safelyGetTimeAndDuration();

            if (duration > 0 && (duration - currentTime) < 10) {
                clearInterval(prefetchWatcher);
                prefetchNextMedia();
            }
        }, 5000)
    }

    function prefetchNextMedia() {
        const nextVideo = getNextVideo();
        if (!nextVideo || !nextVideo.direct) return;

        let videoElement = document.createElement('video');
        videoElement.src = nextVideo.url;
        videoElement.preload = 'auto';
        videoElement.height = 0;
        videoElement.width = 0;
        videoElement.onerror = () => videoElement = null;
        // TODO: Test both
        // videoElement.oncanplay = () => videoElement = null;
        videoElement.oncanplaythrough = () => videoElement = null;
    }

    function resetRefs() {
        videoEl = null;
    }

    function init() {
        // TODO: fix time parser later
        try {
            const { updatePlayer } = props;
            // eslint-disable-next-line prefer-destructuring
            volume = localStorage.volume;
            volume = JSON.parse(volume as any || 1);
            updatePlayer({ volume });
        } catch (error) { }
    }

    function handleReady() {
        updateTime();
        // handleMouseMove();
    }

    function updateTime() {
        const [duration, currentTime] = safelyGetTimeAndDuration();
        videoEl = playerRef.current.getInternalPlayer();
        props.updatePlayer({ duration, currentTime });
    }

    function safelyGetTimeAndDuration(): [number, number] {
        try {
            const duration = playerRef.current.getDuration() as number;
            const currentTime = playerRef.current.getCurrentTime() as number;
            return [duration, currentTime]
        } catch (error) {
            return [0, 0]
        }
    }

    function safelySeekTo(n: number, type = 'seconds') {
        try {
            playerRef.current.seekTo(n, type);
        } catch (error) { }
    }

    function checkDelay() {
        const { actualTime, currentTime, playing } = props.media;
        const { setPlaying } = props;

        const shouldSeek = Math.abs(actualTime - currentTime) > MAX_VIDEO_SYNC_OFFSET;
        if (shouldSeek && synced) safelySeekTo(actualTime);
        if (!playing && synced) setPlaying()
    }

    function getBufferedTime() {
        const [duration] = safelyGetTimeAndDuration();
        const buffered = videoEl ? videoEl.buffered : null
        if (!buffered || !duration) return [];
        return Array(buffered.length)
            .fill(0)
            .map((_, i) => {
                const start = buffered.start(i) / duration * 100;
                const end = buffered.end(i) / duration * 100;
                return {
                    start,
                    end: end - start,
                }
            })
    }

    function handlePlaying({ playedSeconds }) {
        const buffered = getBufferedTime();
        setBuffered(buffered);
        props.updatePlayer({ currentTime: playedSeconds });
        // handleMouseMove();
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
        // const e = new Event('videoplay');
        // document.dispatchEvent(e);
    };
    const handlePause = () => {
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
        const { media } = props;
        const url = getCurrentUrl();
        const nextVideo = getNextVideo();
        const direct = isDirect();
        const iframe = isIframe();
        return (
            <React.Fragment>
                {!iframe && <ReactPlayer
                    ref={playerRef}
                    className="player-inner"
                    width="100%"
                    height=""
                    onPlay={handlePlay}
                    onPause={handlePause}
                    config={playerConf}
                    autoPlay
                    controls={!direct}
                    loop={false}
                    progressInterval={50}
                    muted={media.muted}
                    playing={media.playing}
                    volume={media.volume}
                    url={url}
                    onProgress={handlePlaying}
                    onReady={handleReady}
                />}
                {iframe &&
                    <div dangerouslySetInnerHTML={{ __html: url }} style={{ width: "100%" }} className="player-inner">
                    </div>
                }
                {isDirectLink() && <div className="video-overlay" />}
                {<PreloadMedia nextVideo={nextVideo} />}
            </React.Fragment>
        );
    }

    function renderPlayerGUI() {
        const { showSubs } = props.media;
        // TODO: Hide time for streams
        const playerClasses = cn('video-player', {
            'video-player__sync-on': synced,
            'video-player__sync-off': !synced,
        });
        return (
            <div className={playerClasses}>
                {renderVideoTop()}
                {renderVideoMid()}
                {videoEl && <Subtitles videoEl={videoEl} />}
                <div className="video-player_overflow" />
            </div>
        );
    }

    function handleProgressChange(percent) {
        if (synced) setSynced(false);
        safelySeekTo(percent / 100, 'fraction')
    }

    function renderVideoTop() {
        const { media } = props;
        const currentTime = playerRef.current.getCurrentTime();
        const progressValue = (currentTime / media.duration) * 100;
        return (
            <div className="video-player_top">
                <div className="video-time current-time">{formatTime(media.currentTime)}</div>
                <ProgressBar subProgress={buffered} onProgressChange={handleProgressChange} value={progressValue} />
                <div className="video-time duration">{formatTime(media.duration)}</div>
            </div>
        );
    }

    function toggleFullscreen() {
        const video = document.getElementById('video-container');
        requestFullscreen(video);
    }

    function toggleSynced() {
        setSynced(!synced)
        checkDelay();
        if (!synced) safelySeekTo(props.media.actualTime);
    }

    function togglePlay() {
        const { switchPlay } = props;
        if (synced) setSynced(false);
        switchPlay();
    }

    function toggleSubs() {
        props.toggleSubs();
    }

    function renderVideoMid() {
        const { media } = props;
        return (
            <div className="video-player_mid">
                {renderVolumeControl()}
                <div title="Toggle playback" onClick={togglePlay} className="control play-button">
                    <i className={`fa fa-${media.playing ? 'pause' : 'play'}`} />
                </div>
                {/* <div onClick={toggleCinemaMode} className="control toggle-cinemamode"> */}
                {/* {!cinemaMode && <i className="fas fa-film" />}
                {cinemaMode && <i className="fas fa-film" />} */}
                {/* </div> */}
                <div
                    onClick={toggleSubs}
                    className={cn('control', 'toggle-subtitles', { 'subs-off': !media.showSubs })}
                    title="Toggle subtitles"
                >
                    <i className="fas fa-closed-captioning" />
                </div>
                <div
                    onClick={toggleSynced}
                    title={synced ? 'Playback is synchronized' : 'Playback is not synchronized'}
                    className={cn('control', 'toggle-sync', { 'sync-off': !synced })}
                >
                    <span className="toggle-sync__sign">SYNC</span>
                    <span className="toggle-sync__icon"></span>
                </div>
                <div
                    onClick={toggleFullscreen}
                    className="control toggle-fullscreen"
                    title="Toggle fullscreen"
                >
                    <i className="fas fa-expand" />
                </div>
            </div>
        );
    }

    function handleVolumeChange(percent) {
        props.setVolume(percent / 100);
    }

    function renderVolumeControl() {
        const { switchMute } = props;
        const { muted, volume: volume_ } = props.media;
        return (
            <React.Fragment>
                <div onClick={switchMute} className="control volume-button">
                    <i className={`fa fa-volume-${muted ? 'mute' : 'up'}`} />
                </div>
                <ProgressBar
                    wheel
                    onWheelClick={switchMute}
                    classes={`volume-control ${muted ? 'volume-control_muted' : ''}`}
                    onProgressChange={handleVolumeChange}
                    value={muted ? 0 : volume_ * 100}
                />
            </React.Fragment>
        );
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
    return (
        <React.Fragment>
            <div
                onMouseLeave={setMinimizedTrue}
                onMouseMove={setMinimizedFalse}
                className={classes}
            >
                {RenderPlayer()}
                {isDirectLink() && playerRef.current && renderPlayerGUI()}
            </div>
        </React.Fragment>
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
    playlist: state.media.playlist,
    playing: state.media.playing,
    cinemaMode: state.mainStates.cinemaMode,
} as any);

const mapDispatchToProps = {
    updatePlayer: (payload: any) => ({ type: types.UPDATE_MEDIA, payload }),
    resetMedia: () => ({ type: types.RESET_MEDIA }),
    switchPlay: () => ({ type: types.SWITCH_PLAY }),
    switchMute: () => ({ type: types.SWITCH_MUTE }),
    setVolume: (payload: any) => ({ type: types.SET_VOLUME, payload }),
    toggleCinemaMode: () => ({ type: types.TOGGLE_CINEMAMODE }),
    toggleSync: () => ({ type: types.TOGGLE_SYNC }),
    hideSubs: () => ({ type: types.HIDE_SUBS }),
    toggleSubs: () => ({ type: types.TOGGLE_SUBS }),
    setPlaying: () => ({ type: types.SET_PLAY })
} as any;

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Player);

// export default Player;
// export default createConsumer(Player);

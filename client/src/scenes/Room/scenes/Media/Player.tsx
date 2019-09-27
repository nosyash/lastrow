import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import ReactPlayer from 'react-player';
import cn from 'classnames';
import { throttle } from 'lodash';
import { get } from 'lodash';
import * as types from '../../../../constants/actionTypes';
import { formatTime, requestFullscreen } from '../../../../utils';
import { PLAYER_MINIMIZE_TIMEOUT, MAX_VIDEO_SYNC_OFFSET } from '../../../../constants';

import ProgressBar from './components/ProgressBar';
import Subtitles from './components/Subtitles';
import { fetchSubs } from '../../../../actions';
import { playerConf } from '../../../../conf';
import { Video } from '../../../../utils/types';

let minimizeTimer = null;
let prefetchWatcher = null;
let videoEl = null;

function Player(props) {
    const [minimized, setMinimized] = useState(false);
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

        return () => {
            clearInterval(prefetchWatcher);
            document.removeEventListener('mousemove', handleMouseMove);
        }
    });

    useEffect(() => { checkDelay() }, [props.media.actualTime]);

    useEffect(() => { watchPlaylist() }, [props.media.playlist])

    function watchPlaylist() {
        const isVideoHasChanged = isVideoChanged();
        if (isVideoHasChanged) safelySeekTo(0);
        if (isVideoHasChanged) waitForPrefetch();
    }

    function isVideoChanged(): boolean {
        const currentVideo = getCurrentVideo()

        const currentVideoId = get(currentVideo, '__id')
        const oldVideoId = get(currentVideoRef.current, '__id')

        currentVideoRef.current = currentVideo;
        return currentVideoId !== oldVideoId;
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
            handleSubs();
        } catch (error) { }
    }

    function handleSubs() {
        const subsUrl = get(props.media, 'subs.url');
        if (subsUrl) props.getSubs(subsUrl);
    }

    function handleReady() {
        updateTime();
        // handleMouseMove();
    }

    function updateTime() {
        const [duration, currentTime] = safelyGetTimeAndDuration();
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
        const { actualTime, currentTime } = props.media;

        const shouldSeek = Math.abs(actualTime - currentTime) > MAX_VIDEO_SYNC_OFFSET;
        if (shouldSeek) safelySeekTo(actualTime);
    }

    function handlePlaying({ playedSeconds }) {
        props.updatePlayer({ currentTime: playedSeconds });
        // handleMouseMove();
    }

    function handleMouseMove({ target }) {
        document.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(minimizeTimer);
        if (target.closest('.video-player')) return;
        if (minimized) return;

        minimizeTimer = setTimeout(() => setMinimized(true), PLAYER_MINIMIZE_TIMEOUT);
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
                {<PreloadIframe nextVideo={nextVideo} />}
            </React.Fragment>
        );
    }

    function renderPlayerGUI() {
        const { showSubs, forceSync } = props.media;
        // TODO: Hide time for streams
        // const { } = getCurrentVideo() || {};
        const playerClasses = cn('video-player', {
            'video-player_sync-on': forceSync,
            'video-player_sincin-off': !forceSync,
        });
        return (
            <div className={playerClasses}>
                {renderVideoTop()}
                {renderVideoMid()}
                {showSubs && videoEl && <Subtitles videoEl={videoEl} />}
                <div className="video-player_overflow" />
            </div>
        );
    }

    function handleProgressChange(percent) {
        safelySeekTo(percent / 100, 'fraction')
    }

    function renderVideoTop() {
        const { media } = props;
        const currentTime = playerRef.current.getCurrentTime();
        const progressValue = (currentTime / media.duration) * 100;
        return (
            <div className="video-player_top">
                <div className="video-time current-time">{formatTime(media.currentTime)}</div>
                <ProgressBar onProgressChange={handleProgressChange} value={progressValue} />
                <div className="video-time duration">{formatTime(media.duration)}</div>
            </div>
        );
    }

    function toggleFullscreen() {
        const video = document.getElementById('video-container');
        requestFullscreen(video);
    }

    function renderVideoMid() {
        const { media, switchPlay, cinemaMode, forceSync } = props;
        const { toggleCinemaMode, toggleSync } = props;
        return (
            <div className="video-player_mid">
                {renderVolumeControl()}
                <div onClick={switchPlay} className="control play-button">
                    <i className={`fa fa-${media.playing ? 'pause' : 'play'}`} />
                </div>
                {/* <div onClick={toggleCinemaMode} className="control toggle-cinemamode">
          {!cinemaMode && <i className="fas fa-film" />}
          {cinemaMode && <i className="fas fa-film" />}
        </div> */}
                <div onClick={toggleFullscreen} className="control toggle-fullscreen">
                    <i className="fas fa-expand" />
                </div>
                {/* <div
          onClick={toggleSync}
          className={cn('control', 'toggle-sync', { 'sync-on': forceSync })}
        >
          <i className="fas fa-sync-alt" />
        </div> */}
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
                onMouseLeave={() => setMinimized(true)}
                onMouseMove={() => setMinimized(false)}
                className={classes}
            >
                {RenderPlayer()}
                {isDirectLink() && playerRef.current && renderPlayerGUI()}
            </div>
        </React.Fragment>
    );
}

function PreloadIframe({ nextVideo }: { nextVideo: Video | null }) {
    const [show, setShow] = useState(true);
    const timer = useRef(null);

    if (!show) return null;
    if (!nextVideo) return null;
    if (nextVideo.direct) return null;

    // YouTube video doesn't have 'iframe' property,
    // because this property refers to user-provided custom iframe code
    if (nextVideo.iframe) return null;

    const handleAutoClose = () => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setShow(false), 7000);
    }

    useEffect(() => {
        setShow(true);
        handleAutoClose();

        return () => { clearTimeout(timer.current) }
    }, [nextVideo.url])
    

    return (
        <ReactPlayer
            className="preload-player"
            width="0px"
            height="0px"
            // TODO: Maybe just set to display: none?
            style={{ visibility: 'hidden' }}
            config={playerConf}
            autoPlay
            controls={false}
            loop={false}
            progressInterval={10000}
            muted={true}
            playing={true}
            volume={0}
            url={nextVideo.url}
        />
    );
}

const mapStateToProps = state => ({
    media: state.media,
    playlist: state.media.playlist,
    subs: state.media.subs,
    playing: state.media.playing,
    cinemaMode: state.mainStates.cinemaMode,
    forceSync: state.media.forceSync,
});

const mapDispatchToProps = {
    updatePlayer: payload => ({ type: types.UPDATE_MEDIA, payload }),
    resetMedia: () => ({ type: types.RESET_MEDIA }),
    switchPlay: () => ({ type: types.SWITCH_PLAY }),
    switchMute: () => ({ type: types.SWITCH_MUTE }),
    setVolume: payload => ({ type: types.SET_VOLUME, payload }),
    toggleCinemaMode: () => ({ type: types.TOGGLE_CINEMAMODE }),
    updateSubs: payload => ({ type: types.SET_SUBS, payload }),
    toggleSync: () => ({ type: types.TOGGLE_SYNC }),
    getSubs: payload => fetchSubs(payload),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Player);

// export default Player;
// export default createConsumer(Player);

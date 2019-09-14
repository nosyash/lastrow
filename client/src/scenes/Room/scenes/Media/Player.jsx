import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import ReactPlayer from 'react-player';
import cn from 'classnames';
import { throttle } from 'lodash';
import * as types from '../../../../constants/actionTypes';
import { formatTime, requestFullscreen } from '../../../../utils';
import { PLAYER_MINIMIZE_TIMEOUT, MAX_VIDEO_SYNC_OFFSET } from '../../../../constants';

import ProgressBar from './components/ProgressBar';
import Subtitles from './components/Subtitles';
import { fetchSubs } from '../../../../actions';
import { playerConf } from '../../../../Conf';

let minimizeTimer = null;
let videoEl = null;

function Player(props) {
    const [minimized, setMinimized] = useState(false);
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
    });

    useEffect(() => {
        checkDelay();
    }, [props.media.actualTime]);

    function resetRefs() {
        videoEl = null;
    }

    function init() {
    // TODO: fix it later
        try {
            const { updatePlayer } = props;
            // eslint-disable-next-line prefer-destructuring
            volume = localStorage.volume;
            volume = JSON.parse(volume || 1);
            updatePlayer({ volume });
            handleSubs();
        } catch (error) {}
    }

    async function handleSubs() {
        const { media } = props;
        if (!media || !media.subs.url) return;
        props.getSubs(media.subs.url);
    }

    function handleReady() {
        updateTime();
    // handleMouseMove();
    }

    function updateTime() {
        const { updatePlayer } = props;
        if (!playerRef) return;
        videoEl = playerRef.current.getInternalPlayer();
        const duration = playerRef.current.getDuration();
        const currentTime = playerRef.current.getCurrentTime();
        updatePlayer({ duration, currentTime });
    }

    function checkDelay() {
        const { actualTime, currentTime } = props.media;

        if (Math.abs(actualTime - currentTime) > MAX_VIDEO_SYNC_OFFSET) {
            playerRef.current.seekTo(actualTime);
        }
    }

    function handlePlaying(progress) {
        const { updatePlayer } = props;
        const { playedSeconds } = progress;
        updatePlayer({ currentTime: playedSeconds });
    // handleMouseMove();
    }

    function handleMouseMove({ target }) {
        document.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(minimizeTimer);
        if (target.closest('.video-player')) return;
        if (!minimized) {
            minimizeTimer = setTimeout(() => {
                setMinimized(true);
            }, PLAYER_MINIMIZE_TIMEOUT);
        }
    }

    const handlePlay = () => {
    // const e = new Event('videoplay');
    // document.dispatchEvent(e);
    };

    const handlePause = () => {
    // const e = new Event('videopause');
    // document.dispatchEvent(e);
    };

    function getCurrentVideo() {
        const { playlist } = props;
        if (playlist.length) return playlist[0];
    }

    function getCurrentUrl() {
        const video = getCurrentVideo();
        if (video) return video.url;
        return '';
    }

    function isDirect() {
        const current = getCurrentVideo();
        if (current) return current.direct;
        return false;
    }

    function RenderPlayer() {
        const { media } = props;
        const url = getCurrentUrl();
        const direct = isDirect();
        return (
            <React.Fragment>
                <ReactPlayer
                    ref={playerRef}
                    className="player-inner"
                    width="100%"
                    height=""
                    onPlay={handlePlay}
                    onPause={handlePause}
                    config={playerConf}
                    autoPlay
                    // WTF IS GOING ON HERE
                    controls={!direct}
                    loop={false}
                    progressInterval={50}
                    muted={media.muted}
                    playing={media.playing}
                    volume={media.volume}
                    url={url}
                    onProgress={handlePlaying}
                    // onPlay={handlePlay}
                    // onPause={handlePause}
                    onReady={handleReady}
                />
                {isDirectLink() && <div className="video-overlay" />}
            </React.Fragment>
        );
    }

    function renderPlayerGUI() {
        const { showSubs, forceSync } = props.media;
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
        playerRef.current.seekTo(percent / 100, 'fraction');
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

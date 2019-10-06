import React, { useState, useRef, useEffect, Dispatch, Component } from 'react';
import ReactRedux, { connect, MapStateToProps } from 'react-redux';
import ReactPlayer from 'react-player';
import cn from 'classnames';
import { get } from 'lodash';
import * as types from '../../../../constants/actionTypes';
import { formatTime, requestFullscreen } from '../../../../utils';
import { PLAYER_MINIMIZE_TIMEOUT, MAX_VIDEO_SYNC_OFFSET } from '../../../../constants';
import * as api from '../../../../constants/apiActions'

import ProgressBar from './components/ProgressBar';
import Subtitles from './components/Subtitles';
import { playerConf } from '../../../../conf';
import { Video } from '../../../../utils/types';
import { Media } from '../../../../reducers/media';
import { webSocketSend } from '../../../../actions';

let minimizeTimer = null;
let remoteControlTimer = null;
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
    const [synced, setSynced] = useState(true);
    const [remoteControlShow, setRemoteControlShow] = useState(false)
    // We only use currentTime to update player time.
    // In other case we get time directly from video element.
    const [currentTime, setCurrentTime] = useState(0);
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

        return () => {
            clearTimeout(remoteControlTimer)
            clearTimeout(minimizeTimer)
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

    function checkDelay() {
        const { actualTime, playing } = props.media;
        const { setPlaying } = props;

        const shouldSeek = Math.abs(actualTime - currentTime) > MAX_VIDEO_SYNC_OFFSET;
        if (shouldSeek && synced) safelySeekTo(actualTime);
        if (!playing && synced) setPlaying()
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
                    playing={media.playing}
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
                {<PreloadMedia nextVideo={nextVideo} />}
            </React.Fragment>
        );
    }

    function renderPlayerGUI() {
        const { showSubs } = props.media;
        const playerClasses = cn('video-player', {
            'video-player__sync-on': synced,
            'video-player__sync-off': !synced,
        });
        return (
            <div className={playerClasses}>
                {renderVideoTop()}
                {renderVideoMid()}
                {showSubs && videoEl && <Subtitles videoEl={videoEl} />}
                {remoteControlShow &&
                    <div onClick={handleRemoteRewind} className="video-player__remote-control">Rewind here for everyone else</div>}
                <div className="video-player__overflow" />
            </div>
        );
    }

    function handleRemoteRewind() {
        const [_, time] = safelyGetTimeAndDuration()
        webSocketSend(api.REWIND_MEDIA({ time }))
        setSynced(true)
        setRemoteControlShow(false);
    }

    function handleProgressChange(percent: number) {
        if (synced) setSynced(false);
        safelySeekTo(percent / 100, 'fraction')

        clearTimeout(remoteControlTimer)
        if (!remoteControlShow) {
            setRemoteControlShow(true);
        }
        remoteControlTimer = setTimeout(() => {
            setRemoteControlShow(false);
        }, 4000);
    }

    function renderVideoTop() {
        const { media } = props;
        if (!videoEl) return null;
        return (
            <div className="video-player_top">
                <div className="video-time current-time">{formatTime(currentTime)}</div>
                <CustomProgressBar shouldUpdate={!minimized} handleProgressChange={handleProgressChange} videoEl={videoEl} />
                <div className="video-time duration">{formatTime(media.duration)}</div>
            </div>
        );
    }

    function toggleFullscreen() {
        const video = document.getElementById('video-container');
        requestFullscreen(video);
    }

    function enableSync() {
        setSynced(true)
        checkDelay();
        if (!synced) safelySeekTo(props.media.actualTime);
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
                    <span className="toggle-sync__icon" />
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
        <div
            onMouseLeave={setMinimizedTrue}
            onMouseMove={setMinimizedFalse}
            className={classes}
        >
            {RenderPlayer()}
            {isDirectLink() && playerRef.current && renderPlayerGUI()}
        </div>
    );
}

interface CustomProgressBarProps {
    videoEl: HTMLVideoElement;
    shouldUpdate: boolean;
    handleProgressChange: (...args) => void;
}

interface CustomProgressBarState {
    buffered: any[];
    progressValue: number;
}

class CustomProgressBar extends Component<CustomProgressBarProps, CustomProgressBarState> {
    private timer: NodeJS.Timeout;
    state = {
        buffered: [],
        progressValue: 0,
    }

    componentDidMount() {
        this.watchTime();
    }

    componentWillUnmount() {
        clearTimeout(this.timer)
    }

    shouldComponentUpdate(nextProps: CustomProgressBarProps, nextState: CustomProgressBarState) {
        if (nextProps.shouldUpdate) {
            return true;
        } else {
            return false;
        }
    }

    getBufferedTime = () => {

        const { duration } = this.props.videoEl;
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

    watchTime = () => {
        const { videoEl, shouldUpdate } = this.props;
        if (videoEl && shouldUpdate) {
            const buffered = this.getBufferedTime();
            const currentTime = this.props.videoEl.currentTime;
            const duration = this.props.videoEl.duration;
            const progressValue = (currentTime / duration) * 100;
            this.setState({ buffered, progressValue })
        }
        this.timer = setTimeout(this.watchTime, 32);
    }

    render() {
        const { buffered, progressValue } = this.state;
        if (!this.props.videoEl) return null;
        const { handleProgressChange } = this.props;
        return (
            <ProgressBar subProgress={buffered} onProgressChange={handleProgressChange} value={progressValue} />
        )
    }
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

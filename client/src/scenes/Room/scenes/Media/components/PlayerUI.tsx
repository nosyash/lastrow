import React, { useState, useRef, useEffect, Dispatch, Component } from 'react';
import ReactRedux, { connect, MapStateToProps } from 'react-redux';
import ReactPlayer from 'react-player';
import cn from 'classnames';
import { get } from 'lodash';
import * as types from '../../../../../constants/actionTypes';
import { formatTime, requestFullscreen } from '../../../../../utils';
import { PLAYER_MINIMIZE_TIMEOUT, MAX_VIDEO_SYNC_OFFSET } from '../../../../../constants';
import * as api from '../../../../../constants/apiActions'
import { useSelector } from 'react-redux'

import ProgressBar from './ProgressBar';
import Subtitles from './Subtitles';
import { playerConf } from '../../../../../conf';
import { Video } from '../../../../../utils/types';
import { Media } from '../../../../../reducers/media';
import { webSocketSend } from '../../../../../actions';

interface PlayerUIProps {
    synced: boolean;
    playing: boolean;
    showSubs: boolean;
    remotePlaying: boolean;
    videoEl: HTMLVideoElement;
    remoteControlRewind: boolean;
    remoteControlPlaying: boolean;
    duration: number;
    currentTime: number;
    minimized: boolean;
    muted: boolean;
    volume: number;

    onToggleSynced: () => void;
    onToggleSubs: () => void;
    onTogglePlay: () => void;
    onToggleMute: () => void;
    onProgressChange: (n: number) => void;
    onVolumeChange: (...args) => void;
}

export default function PlayerUI(props: PlayerUIProps) {
    const { showSubs, videoEl, synced, playing, minimized } = props;


    function renderAll() {
        const playerClasses = cn('video-player', {
            'video-player__sync-on': synced,
            'video-player__sync-off': !synced,
        });
        return (
            <div className={playerClasses}>
                {videoEl && <div className="video-player_top">
                    <div className="video-time current-time">{formatTime(props.currentTime)}</div>
                    <CustomProgressBar shouldUpdate={!minimized} handleProgressChange={props.onProgressChange} videoEl={videoEl} />
                    <div className="video-time duration">{formatTime(props.duration)}</div>
                </div>}
                {renderVideoMid()}
                {showSubs && videoEl && <Subtitles videoEl={videoEl} />}

            </div>
        );
    }

    function toggleFullscreen() {
        const video = document.getElementById('video-container');
        requestFullscreen(video);
    }


    function renderVideoMid() {
        return (
            <div className="video-player_mid">
                {renderVolumeControl()}
                <div title="Toggle playback" onClick={props.onTogglePlay} className="control play-button">
                    <i className={`fa fa-${playing ? 'pause' : 'play'}`} />
                </div>
                <div
                    onClick={props.onToggleSubs}
                    className={cn('control', 'toggle-subtitles', { 'subs-off': !props.showSubs })}
                    title="Toggle subtitles"
                >
                    <i className="fas fa-closed-captioning" />
                </div>
                {/* <div
                    onClick={props.onToggleSynced}
                    title={synced ? 'Playback is synchronized' : 'Playback is not synchronized'}
                    className={cn('control', 'toggle-sync', { 'sync-off': !synced })}
                >
                    <span className="toggle-sync__sign">SYNC</span>
                    <span className="toggle-sync__icon" />
                </div> */}
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


    function renderVolumeControl() {
        return (
            <React.Fragment>
                <div onClick={props.onToggleMute} className="control volume-button">
                    <i className={`fa fa-volume-${props.muted ? 'mute' : 'up'}`} />
                </div>
                <ProgressBar
                    wheel
                    onWheelClick={props.onToggleMute}
                    classes={`volume-control ${props.muted ? 'volume-control_muted' : ''}`}
                    onProgressChange={props.onVolumeChange}
                    value={props.muted ? 0 : props.volume * 100}
                />
            </React.Fragment>
        );
    }

    return renderAll()
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

    shouldComponentUpdate({ shouldUpdate }: CustomProgressBarProps) {
        if (shouldUpdate) {
            return true;
        }
        return false;

    }

    getBufferedTime = () => {
        const { videoEl } = this.props;
        const { duration } = videoEl;
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

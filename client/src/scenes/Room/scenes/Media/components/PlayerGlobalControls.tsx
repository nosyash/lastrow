import React, { useState, useRef, useEffect } from 'react';

interface PlayerGlobalControlsProps {
    showRemoteRewind: boolean;
    showRemotePlayback: boolean;
    playing: boolean;
    remotePlaying: boolean;
    synced: boolean;

    onRemoteRewind: () => void;
    onRemotePlaying: () => void;
}


function PlayerGlobalControls(props: PlayerGlobalControlsProps) {
    function renderControls() {
        return (
            <div className="global-controls">
                {props.showRemoteRewind && renderRewindButton()}
                {props.showRemotePlayback && renderPlaybackButton()}
                {/* <div className="video-player__overflow" /> */}
            </div>
        )
    }

    function renderRewindButton() {
        const { showRemoteRewind, synced } = props;
        if (!showRemoteRewind && !synced) return null;
        return <div onClick={props.onRemoteRewind} className="global-controls__item global-controls__rewind">Rewind here for everyone else</div>
    }

    function renderPlaybackButton() {
        const { showRemotePlayback, remotePlaying } = props;
        const hideRemotePlaying = props.playing === remotePlaying
        if (!showRemotePlayback && hideRemotePlaying) return null;
        const remoteControlText = props.playing ? 'Resume for everyone else' : 'Pause for everyone else';
        return <div onClick={props.onRemotePlaying} className="global-controls__item global-controls__playing">{remoteControlText}</div>
    }

    return renderControls()
}

export default PlayerGlobalControls;

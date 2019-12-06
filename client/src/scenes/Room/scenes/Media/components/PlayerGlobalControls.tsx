import React from 'react';
import cn from 'classnames'

interface PlayerGlobalControlsProps {
    showRemoteRewind: boolean;
    showRemotePlayback: boolean;
    playing: boolean;
    remotePlaying: boolean;
    synced: boolean;
    hasVideo: boolean;
    onRemoteRewind: () => void;
    onRemotePlaying: () => void;

    onToggleSync: () => void;
}

function PlayerGlobalControls(props: PlayerGlobalControlsProps) {
    function renderControls() {
        return (
            <div className="global-controls">
                {props.hasVideo && renderSyncButton(!props.synced)}
            </div>
        )
    }

    function renderSyncButton(show: boolean) {
        return (
            <div
                onClick={props.onToggleSync}
                title="Turn on"
                className={cn(['global-controls__item global-controls__sync', { 'is-visible': show }])}
            >
                <i className="fa fa-sync mr-2" />
                Synchronize media
            </div>
        )
    }

    return renderControls()
}

export default PlayerGlobalControls;

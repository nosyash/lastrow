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

const remoteIcon = <i title="This is a remote action" className="fa fa-bullhorn ml-1" />

function PlayerGlobalControls(props: PlayerGlobalControlsProps) {
    function renderControls() {
        return (
            <div className="global-controls">
                {/* TODO: Completely remove buttons and their components  */}
                {/* {isPermit('player_event.rewind') && renderRewindButton(props.showRemoteRewind)} */}
                {/* {isPermit('player_event.pause') && renderPlaybackButton(props.showRemotePlayback)} */}
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
                Sync with remote
            </div>
        )
    }

    function renderRewindButton(show: boolean) {
        const { synced } = props;
        return (
            <div
                onClick={props.onRemoteRewind}
                className={cn([
                    'global-controls__item global-controls__rewind global-controls__admin',
                    { 'is-visible': show && !synced }
                ])}
            >
                <i className="fa fa-forward mr-1" />
                Remotely rewind
                {remoteIcon}
            </div>
        )
    }

    function renderPlaybackButton(show: boolean) {
        const { remotePlaying } = props;
        const hideRemotePlaying = props.playing === remotePlaying
        const remoteControlText = props.playing ? 'Remotely play' : 'Remotely pause';
        const playIcon = props.playing ? <i className="fa fa-play mr-1" /> : <i className="fa fa-pause mr-1" />
        return (
            <div
                onClick={props.onRemotePlaying}
                className={cn([
                    'global-controls__item global-controls__playing global-controls__admin',
                    { 'is-visible': show && !hideRemotePlaying }
                ])}
            >
                {playIcon}
                {remoteControlText}
                {remoteIcon}
            </div>
        )
    }

    return renderControls()
}

export default PlayerGlobalControls;

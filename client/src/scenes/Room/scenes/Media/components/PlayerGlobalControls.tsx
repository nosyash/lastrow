import React from 'react';
import { PermissionsMap, Permissions } from '../../../../../reducers/rooms';
import { isPermit } from '../../../../../utils';

interface PlayerGlobalControlsProps {
    showRemoteRewind: boolean;
    showRemotePlayback: boolean;
    playing: boolean;
    remotePlaying: boolean;
    synced: boolean;
    permissionLevel: PermissionsMap;
    currentPermissions: Permissions;


    onRemoteRewind: () => void;
    onRemotePlaying: () => void;

    onToggleSync: () => void;
}

const remoteIcon = <i title="This is a remote action" className="fa fa-bullhorn ml-1" />

function PlayerGlobalControls(props: PlayerGlobalControlsProps) {
    function renderControls() {
        const perms = props.currentPermissions;
        const permit = isPermit(props.permissionLevel)
        return (
            <div className="global-controls">
                {permit(perms.player_event.rewind) && props.showRemoteRewind && renderRewindButton()}
                {permit(perms.player_event.pause) && props.showRemotePlayback && renderPlaybackButton()}
                {!props.synced && renderSyncButton()}
                {/* <div className="video-player__overflow" /> */}
            </div>
        )
    }

    function renderSyncButton() {
        return (

            <div
                onClick={props.onToggleSync}
                title="Turn on"
                className="global-controls__item global-controls__sync"
            >
                <i className="fa fa-sync mr-2" />
                Sync with remote
            </div>
        )
    }

    function renderRewindButton() {
        const { showRemoteRewind, synced } = props;
        if (!showRemoteRewind && !synced) return null;
        return <div
            onClick={props.onRemoteRewind}
            className="global-controls__item global-controls__rewind global-controls__admin"
        >
            <i className="fa fa-forward mr-1" />
            Rewind here for everyone else
            {remoteIcon}
        </div>
    }

    function renderPlaybackButton() {
        const { showRemotePlayback, remotePlaying } = props;
        const hideRemotePlaying = props.playing === remotePlaying
        if (!showRemotePlayback || hideRemotePlaying) return null;
        const remoteControlText = props.playing ? 'Remotely play' : 'Remotely pause';
        const playIcon = props.playing ? <i className="fa fa-play mr-1" /> : <i className="fa fa-pause mr-1" />
        return <div
            onClick={props.onRemotePlaying}
            className="global-controls__item global-controls__playing global-controls__admin"

        >
            {playIcon}
            {remoteControlText}
            {remoteIcon}
        </div>
    }

    return renderControls()
}

export default PlayerGlobalControls;

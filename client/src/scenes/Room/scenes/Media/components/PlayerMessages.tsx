import React from 'react';
import { PermissionsMap, Permissions } from '../../../../../reducers/rooms';

interface PlayerGlobalMessagesProps {
    remotelyPaused: boolean;
    permissionLevel: PermissionsMap;
    currentPermissions: Permissions;

}

function PlayerGlobalMessages(props: PlayerGlobalMessagesProps) {
    function renderMessages() {
        return (
            <div className="global-messages">
                {props.remotelyPaused &&
                    <div
                        className="global-messages__item global-messages__remotely-paused"
                    >
                        <i className="fa fa-pause mr-1" />
                        Video is remotely paused
                    </div>
                }
            </div>
        )
    }

    return renderMessages()
}

export default PlayerGlobalMessages;

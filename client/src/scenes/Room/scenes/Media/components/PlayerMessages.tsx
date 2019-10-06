import React from 'react';

interface PlayerGlobalMessagesProps {
    remotelyPaused: boolean;
    synced: boolean;

    onToggleSync: () => void;
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
                {!props.synced &&
                    <div
                        onClick={props.onToggleSync}
                        title="Turn on"
                        className="global-messages__item global-messages__sync-off is-clickable"
                    >
                        <i className="fa fa-sync mr-1" />
                        Synchronization is turned off
                    </div>}
            </div>
        )
    }

    return renderMessages()
}

export default PlayerGlobalMessages;

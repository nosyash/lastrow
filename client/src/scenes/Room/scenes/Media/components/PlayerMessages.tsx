import React from 'react';

interface PlayerGlobalMessagesProps {
    remotelyPaused: boolean;
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

import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import cn from 'classnames';
import ChatInner from './ChatInner';
import { UPDATE_MAIN_STATES } from '../../../../constants/ActionTypes';
import ControlPanel from '../../../../Components/ControlPanel';

function ChatContainer(props) {
    const { chat, cinemaMode, chatWidth } = props;
    const className = cn({ 'cinema-mode': cinemaMode });

    return (
        <div
            ref={chat}
            style={{ width: chatWidth }}
            className={`chat-container ${className}`}
        >
            {cinemaMode && (
                <span className="resizer">
                    <i className="fa fa-angle-down" />
                </span>
            )}
            <Link to="/" className="control go-back">
                <i className="fa fa-arrow-left" />
                {' Back to rooms'}
            </Link>
            <ChatInner />
            <ControlPanel />
        </div>
    );
}

const mapDispatchToProps = {
    UpdateMainStates: payload => ({ type: UPDATE_MAIN_STATES, payload }),
};

const mapStateToProps = state => ({
    cinemaMode: state.mainStates.cinemaMode,
    chatWidth: state.mainStates.chatWidth,
    wsConnected: state.chat.connected,
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ChatContainer);

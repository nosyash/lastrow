import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import cn from 'classnames';
import ChatInner from './ChatInner';
import { UPDATE_MAIN_STATES } from '../../../../constants/actionTypes';
import ControlPanel from '../../../../components/ControlPanel';
import { State } from '../../../../reducers';

interface ChatContainerProps {
    cinemaMode: boolean;
    chatWidth: number;
}

function ChatContainer(props: ChatContainerProps) {
    const { cinemaMode, chatWidth } = props;
    const className = cn({ 'cinema-mode': cinemaMode });

    return (
        <div
            style={{ width: chatWidth }}
            className={`chat-container ${className}`}
        >
            {/* {cinemaMode && (
                <span className="resizer">
                    <i className="fa fa-angle-down" />
                </span>
            )} */}
            <Link to="/" className="control go-back">
                <i className="fa fa-arrow-left" />
                {' Back to rooms'}
            </Link>
            <ChatInner />
            <ControlPanel cinemaMode={cinemaMode} />
        </div>
    );
}

const mapDispatchToProps = {
    UpdateMainStates: (payload: any) => ({ type: UPDATE_MAIN_STATES, payload }),
};

const mapStateToProps = (state: State) => ({
    cinemaMode: state.mainStates.cinemaMode,
    chatWidth: state.mainStates.chatWidth,
    wsConnected: state.chat.connected,
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ChatContainer);

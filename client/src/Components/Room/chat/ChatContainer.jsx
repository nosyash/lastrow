import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { RESIZER_SEL, CHAT_HEADER_SEL, DIVIDER_SEL } from '../../../constants';
import {
  unsetCursorStyle,
  toggleUserSelect,
  togglePointerEvent,
  toggleCursor,
} from '../../../utils/base';
import ChatInner from './ChatInner';
import { UPDATE_MAIN_STATES } from '../../../constants/ActionTypes';
import ControlPanel from '../../UI/ControlPanel';

function ChatContainer(props) {
  const { chat, cinemaMode, socket, chatWidth } = props;
  const className = cinemaMode ? 'cinema-mode' : '';

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
      <ChatInner socket={socket} />
      <ControlPanel />
    </div>
  );
}

const mapDispatchToProps = {
  UpdateMainStates: payload => ({ type: UPDATE_MAIN_STATES, payload }),
};

const mapStateToProps = state => ({
  cinemaMode: state.MainStates.cinemaMode,
  chatWidth: state.MainStates.chatWidth,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChatContainer);

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

const left = 0;
const top = 0;
let baseX = 0;
let baseY = 0;
let resizing = false;
let moving = false;

function ChatContainer(props) {
  const [width, setWidth] = useState(290);
  const [height, setHeight] = useState(490);
  const [top, setTop] = useState(50);
  const [left, setLeft] = useState(50);
  useEffect(() => {
    if (localStorage.chat) {
      const { chat } = localStorage;
      const chatParams = JSON.parse(chat);
      const { width, height, left, top } = chatParams;

      const coordinates = {
        width: width || 300,
        height: height || 500,
        left: left || 50,
        top: top || 50,
      };

      setStates(coordinates);
    }

    document.addEventListener('mousedown', handleGlobalMouseDown);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleGlobalMouseDown);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  function setStates({ width, height, top, left }) {
    if (width) setWidth(width);
    if (height) setHeight(height);
    if (top) setTop(top);
    if (left) setLeft(left);
  }

  function handleGlobalMouseDown(e) {
    const { cinemaMode } = props;
    const { target } = e;
    if (target.closest(RESIZER_SEL)) {
      handleResizerDown(e, { resizer: true });
    }
    if (target.closest(DIVIDER_SEL)) {
      if (!cinemaMode) {
        handleResizerDown(e, { divider: true });
      }
    }
    if (target.closest(CHAT_HEADER_SEL)) {
      if (cinemaMode) {
        handleHeaderDown(e);
      }
    }
  }

  function handleGlobalMouseMove(e) {
    const { chat, cinemaMode } = props;

    if (!chat.current) return;
    if (resizing && cinemaMode) handleResize(e, { resizer: true });
    if (resizing && !cinemaMode) handleResize(e, { divider: true });
    if (moving) handleMove(e);
  }

  function handleGlobalMouseUp() {
    if (!resizing && !moving) return;
    const { video } = props;

    const chatParams = JSON.stringify({ width, height, left, top });
    localStorage.chat = chatParams;

    resizing = false;
    moving = false;
    toggleUserSelect();
    unsetCursorStyle();
    togglePointerEvent(video.current);
  }

  function handleResizerDown(e, { resizer, divider }) {
    const { video, chat } = props;
    if (resizing) return;
    resizing = true;
    const rect = chat.current.getBoundingClientRect();
    left = rect.left;
    top = rect.top;
    const offset = resizer ? 10 : -5;
    const width = e.clientX - left + offset;
    const height = e.clientY - top + offset;
    if (resizer) setState({ width, height });
    if (divider) setState({ width });

    toggleUserSelect();
    if (resizer) toggleCursor('se-resize');
    if (divider) toggleCursor('e-resize');
    togglePointerEvent(video.current);
  }

  function handleHeaderDown(e) {
    const { video, chat } = props;
    if (moving) return;
    moving = true;
    const rect = chat.current.getBoundingClientRect();
    const { clientX, clientY } = e;
    baseX = clientX;
    baseY = clientY;
    left = rect.left;
    top = rect.top;
    const left = left + clientX - baseX;
    const top = top + clientY - baseY;
    setStates({ left, top });

    toggleUserSelect();
    toggleCursor('move');
    togglePointerEvent(video.current);
  }

  function handleResize(e, { resizer, divider }) {
    let { chat } = props;
    chat = chat.current;

    const offset = resizer ? 10 : -5;
    width = e.clientX - left + offset;
    height = e.clientY - top + offset;

    if (width < 30) {
      chat.classList.add('collapsed');
    } else {
      chat.classList.remove('collapsed');
    }

    if (resizer) setStates({ width, height });
    if (divider) setStates({ width });
  }

  function handleMove(e) {
    if (!moving) return;
    const { clientX, clientY } = e;
    const left = left + clientX - baseX;
    const top = top + clientY - baseY;

    setStates({ left, top });
  }

  const { chat, cinemaMode, socket } = props;
  let newHeight = height;
  newHeight = cinemaMode ? newHeight : '';
  const position = cinemaMode ? 'fixed' : '';
  const className = cinemaMode ? 'cinema-mode' : '';

  return (
    <div
      ref={chat}
      style={{ width, height: newHeight, left, top, position }}
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

const mapStateToProps = state => ({ cinemaMode: state.MainStates.cinemaMode });

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChatContainer);

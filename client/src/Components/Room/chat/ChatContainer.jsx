import React, { Component } from 'react';
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

class ChatContainer extends Component {
  constructor() {
    super();
    this.left = 0;
    this.top = 0;
    this.baseX = 0;
    this.baseY = 0;
    this.resizing = false;
    this.moving = false;
  }

  state = {
    width: 290,
    height: 490,
    top: 50,
    left: 50,
  };

  componentDidMount() {
    if (localStorage.chat) {
      const { chat } = localStorage;
      const chatParams = JSON.parse(chat);
      const { width, height, left, top } = chatParams;

      const params = {
        width: width || 300,
        height: height || 500,
        left: left || 50,
        top: top || 50,
      };

      this.setState({ ...params });
    }

    document.addEventListener('mousedown', this.handleGlobalMouseDown);
    document.addEventListener('mousemove', this.handleGlobalMouseMove);
    document.addEventListener('mouseup', this.handleGlobalMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleGlobalMouseDown);
    document.removeEventListener('mousemove', this.handleGlobalMouseMove);
    document.removeEventListener('mouseup', this.handleGlobalMouseUp);
  }

  handleGlobalMouseDown = e => {
    const { cinemaMode } = this.props;
    const { target } = e;
    if (target.closest(RESIZER_SEL)) {
      this.handleResizerDown(e, { resizer: true });
    }
    if (target.closest(DIVIDER_SEL)) {
      if (!cinemaMode) {
        this.handleResizerDown(e, { divider: true });
      }
    }
    if (target.closest(CHAT_HEADER_SEL)) {
      if (cinemaMode) {
        this.handleHeaderDown(e);
      }
    }
  };

  handleGlobalMouseMove = e => {
    const { chat, cinemaMode } = this.props;

    if (!chat.current) return;
    if (this.resizing && cinemaMode) this.handleResize(e, { resizer: true });
    if (this.resizing && !cinemaMode) this.handleResize(e, { divider: true });
    if (this.moving) this.handleMove(e);
  };

  handleGlobalMouseUp = () => {
    if (!this.resizing && !this.moving) return;
    const { video } = this.props;
    const { width, height, left, top } = this.state;

    const chatParams = JSON.stringify({ width, height, left, top });
    localStorage.chat = chatParams;

    this.resizing = false;
    this.moving = false;
    toggleUserSelect();
    unsetCursorStyle();
    togglePointerEvent(video.current);
  };

  handleResizerDown = (e, { resizer, divider }) => {
    const { video, chat } = this.props;
    if (this.resizing) return;
    this.resizing = true;
    const rect = chat.current.getBoundingClientRect();
    this.left = rect.left;
    this.top = rect.top;
    const offset = resizer ? 10 : -5;
    const width = e.clientX - this.left + offset;
    const height = e.clientY - this.top + offset;
    if (resizer) this.setState({ width, height });
    if (divider) this.setState({ width });

    toggleUserSelect();
    if (resizer) toggleCursor('se-resize');
    if (divider) toggleCursor('e-resize');
    togglePointerEvent(video.current);
  };

  handleHeaderDown = e => {
    const { video, chat } = this.props;
    if (this.moving) return;
    this.moving = true;
    const rect = chat.current.getBoundingClientRect();
    const { clientX, clientY } = e;
    this.baseX = clientX;
    this.baseY = clientY;
    this.left = rect.left;
    this.top = rect.top;
    const left = this.left + clientX - this.baseX;
    const top = this.top + clientY - this.baseY;
    this.setState({ left, top });

    toggleUserSelect();
    toggleCursor('move');
    togglePointerEvent(video.current);
  };

  handleResize = (e, { resizer, divider }) => {
    let { chat } = this.props;
    chat = chat.current;

    let { height, width } = this.state;
    const offset = resizer ? 10 : -5;
    width = e.clientX - this.left + offset;
    height = e.clientY - this.top + offset;

    if (width < 30) {
      chat.classList.add('collapsed');
    } else {
      chat.classList.remove('collapsed');
    }

    if (resizer) this.setState({ width, height });
    if (divider) this.setState({ width });
  };

  handleMove = e => {
    if (!this.moving) return;
    const { clientX, clientY } = e;
    const left = this.left + clientX - this.baseX;
    const top = this.top + clientY - this.baseY;

    this.setState({ left, top });
  };

  render() {
    const { chat, cinemaMode, socket } = this.props;
    const { width, top, left } = this.state;
    let { height } = this.state;
    height = cinemaMode ? height : '';
    const position = cinemaMode ? 'fixed' : '';
    const className = cinemaMode ? 'cinema-mode' : '';
    return (
      <div
        ref={chat}
        style={{ width, height, left, top, position }}
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
}

const mapDispatchToProps = {
  UpdateMainStates: payload => ({ type: UPDATE_MAIN_STATES, payload }),
};

const mapStateToProps = state => ({ cinemaMode: state.MainStates.cinemaMode });

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChatContainer);

import React, { Component } from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';
import * as types from '../../constants/ActionTypes';
import { MIN_CHAT_WIDTH, MAX_CHAT_WIDTH } from '../../constants';

class Divider extends Component {
  constructor() {
    super();
    this.offsetX = 0;
    this.chatInnerEl = null;
    this.state = {
      moving: false,
      width: 0,
    };
  }

  componentDidMount() {
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
    this.setState({ width: this.props.chatWidth });
  }

  handleMouseDown = e => {
    this.setState({ moving: true });

    const { clientX } = e;
    const { chatWidth, chatLeft } = this.getChatCoordinates();
    this.offsetX = clientX - (chatWidth + chatLeft) + chatLeft;

    this.disableUserSelect();
  };

  disableUserSelect = () => {
    const element = document.getElementById('video-container');
    if (!element) return;
    element.classList.add('no-user-select');
  };

  enableUserSelect = () => {
    const element = document.getElementById('video-container');
    if (!element) return;
    element.classList.remove('no-user-select');
  };

  handleMouseMove = e => {
    if (!this.state.moving) return;
    const { clientX } = e;

    const width = clientX - this.offsetX;
    // setChatWidth(width);
    this.setState({ width: Math.max(MIN_CHAT_WIDTH, Math.min(MAX_CHAT_WIDTH, width)) });
  };

  getChatCoordinates() {
    this.chatInnerEl = document.getElementById('chat-inner');
    const { width: chatWidth, left: chatLeft } = this.chatInnerEl.getBoundingClientRect();
    return { chatWidth, chatLeft };
  }

  handleMouseUp = () => {
    if (this.state.moving) this.setState({ moving: false });

    this.enableUserSelect();
    const { setChatWidth } = this.props;
    const width = Math.max(MIN_CHAT_WIDTH, Math.min(MAX_CHAT_WIDTH, this.state.width));
    localStorage.chatWidth = width;
    setChatWidth(width);
  };

  render() {
    const { moving, width } = this.state;
    const transform = `translateX(${width}px)`;
    return (
      <React.Fragment>
        <div
          style={{ transform }}
          onMouseDown={this.handleMouseDown}
          className={cn('custom-divider', { 'custom-divider_moving': moving })}
        >
          {moving && <div className="custom-divider__background"></div>}
        </div>
      </React.Fragment>
    );
  }
}

export default connect(
  state => ({
    chatWidth: state.MainStates.chatWidth,
  }),
  { setChatWidth: payload => ({ type: types.SET_CHAT_WIDTH, payload }) }
)(Divider);

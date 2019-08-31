import React, { Component } from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';
import * as types from '../../constants/ActionTypes';

class Divider extends Component {
  constructor() {
    super();
    this.offsetX = 0;
    this.chatInnerEl = null;
    this.state = {
      moving: false,
    };

    // this.mouseMove = requestAnimationFrame(this.handleMouseMove);
  }

  componentDidMount() {
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
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
    const { setChatWidth } = this.props;
    const { clientX } = e;
    setChatWidth(clientX - this.offsetX);
  };

  getChatCoordinates() {
    this.chatInnerEl = document.getElementById('chat-inner');
    const { width: chatWidth, left: chatLeft } = this.chatInnerEl.getBoundingClientRect();
    return { chatWidth, chatLeft };
  }

  handleMouseUp = () => {
    if (this.state.moving) this.setState({ moving: false });
    localStorage.chatWidth = this.props.chatWidth;

    this.enableUserSelect();
  };

  render() {
    const { moving } = this.state;
    return (
      <div
        onMouseDown={this.handleMouseDown}
        className={cn('custom-divider', { 'custom-divider_moving': moving })}
      />
    );
  }
}

export default connect(
  state => ({
    chatWidth: state.MainStates.chatWidth,
  }),
  { setChatWidth: payload => ({ type: types.SET_CHAT_WIDTH, payload }) }
)(Divider);

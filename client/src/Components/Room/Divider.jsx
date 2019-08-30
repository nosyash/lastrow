import React, { Component, PureComponent } from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';
import { throttle } from 'lodash';
import * as types from '../../constants/ActionTypes';

class Divider extends Component {
  constructor() {
    super();
    this.offsetX = 0;
    this.chatInnerEl = null;
    this.state = {
      moving: false,
    };

    this.mouseMove = throttle(this.handleMouseMove, 16);
  }

  componentDidMount() {
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.mouseMove);
  }

  handleMouseDown = e => {
    this.setState({ moving: true });

    const { clientX } = e;
    const { chatWidth, chatLeft } = this.getChatCoordinates();
    this.offsetX = clientX - (chatWidth + chatLeft) + chatLeft;
  };

  handleMouseMove = e => {
    if (!this.state.moving) return;
    const { setChatWidth } = this.props;
    const { clientX } = e;
    console.log('set');
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

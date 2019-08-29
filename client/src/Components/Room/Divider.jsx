import React, { Component, PureComponent } from 'react';
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
    console.log(this.offsetX);
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

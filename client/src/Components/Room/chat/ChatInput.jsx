import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as types from '../../../constants/ActionTypes';
import * as keys from '../../../constants/keys';
import { MAX_MESSAGE_LENGTH } from '../../../constants';
import * as api from '../../../constants/apiActions';

class ChatInput extends Component {
  constructor() {
    super();
    this.historyN = 0;
    this.state = {
      inputValue: '',
    };
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClick);
  }

  handleClick = e => {
    let { target } = e;
    if (target.closest('.chat-message_reply')) {
      target = target.closest('.chat-message_reply');
      const { name } = target.dataset;
      const { inputValue } = this.state;
      if (name) {
        const value = `@${name} ${inputValue}`;
        this.setState({ inputValue: value });
      }
      this.input.focus();
    }
  };

  handleFormSubmit = e => {
    const { socket, socketState, profile } = this.props;
    let { inputValue } = this.state;

    if (e.keyCode === keys.ENTER && !e.shiftKey) {
      e.preventDefault();
      inputValue = inputValue.trim();
      if (!socketState || !inputValue) return;
      socket.send(api.SEND_MESSAGE(inputValue, profile.uuid));
      this.setState({ inputValue: '' });
    }
  };

  handleInputChange = e => {
    let { value } = e.target;
    if (value.length > MAX_MESSAGE_LENGTH) {
      value = value.substr(0, MAX_MESSAGE_LENGTH);
    }
    this.setState({ inputValue: value });
  };

  render() {
    const { inputValue } = this.state;
    return (
      <div className="chat-input">
        <textarea
          onKeyDown={this.handleFormSubmit}
          ref={ref => (this.input = ref)}
          value={inputValue}
          autoFocus
          placeholder="Write something..."
          onChange={this.handleInputChange}
          className="chat-input"
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  profile: state.profile,
  history: state.Chat.history,
  roomID: state.MainStates.roomID,
  socketState: state.Chat.connected,
});

const mapDispatchToProps = {
  AppendToHistory: payload => ({ type: types.APPEND_TO_HISTORY, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChatInput);

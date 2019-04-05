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
    this.input = React.createRef();

    this.state = {
      value: '',
    };
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleFormSubmit);
    document.addEventListener('click', this.handleClick);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleFormSubmit);
    document.removeEventListener('click', this.handleClick);
  }

  handleClick = e => {
    const { target } = e;
    if (target.closest('.chat-message_reply')) {
      const name = target.getAttribute('name');
      const { value } = this.state;
      if (name) this.setState({ value: `@${name} ${value}` });
      this.input.current.focus();
    }
  };

  handleFormSubmit = e => {
    const { socket, socketState, roomID } = this.props;
    const { value } = e.target;
    // const { selectionEnd, selectionStart } = this.input.current;
    // const resetHistoryN = () => (this.historyN = history.length - 1);

    if (e.keyCode === keys.ENTER && !e.shiftKey) {
      e.preventDefault();
      if (!socketState) return;
      if (value === '') return;

      socket.send(api.SEND_MESSAGE(value, roomID));
      this.setState({ value: '' });
      // resetHistoryN();
    }

    // if (
    //   !(
    //     selectionEnd === 0 ||
    //     selectionStart === 0 ||
    //     selectionEnd === value.length ||
    //     selectionStart === value.length
    //   )
    // )
    //   return;
    // if (selectionEnd && e.keyCode === KEY_UP) {
    //   this.historyN = this.historyN - 1;
    //   if (this.historyN < 0) resetHistoryN();
    //   const i = this.historyN;
    //   this.setState({ value: history[i] });
    // }
    // if (e.keyCode === KEY_DOWN) {
    //   this.historyN = this.historyN + 1;
    //   console.log(this.historyN, history.length - 1);
    //   if (this.historyN > history.length - 1) this.historyN = 0;
    //   const i = this.historyN;
    //   this.setState({ value: history[i] });
    // }
  };

  handleInputChange = e => {
    let { value } = e.target;
    if (value.length > MAX_MESSAGE_LENGTH) value = value.substr(0, MAX_MESSAGE_LENGTH);
    this.setState({ value });
  };

  render() {
    const { value } = this.state;
    return (
      <div className="chat-input">
        <textarea
          ref={this.input}
          value={value}
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

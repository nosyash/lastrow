import React, { Component } from 'react';
import { connect } from 'react-redux';
import { APPEND_TO_HISTORY } from '../../../constants/ActionTypes';
import { KEY_UP, KEY_DOWN, KEY_ENTER } from '../../../constants/keys';
import { MAX_MESSAGE_LENGTH } from '../../../constants';

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
    const { socket, history } = this.props;
    const { roomID } = this.props;
    const { value } = e.target;
    const { selectionEnd, selectionStart } = this.input.current;

    const resetHistoryN = () => (this.historyN = history.length - 1);

    if (e.keyCode === KEY_ENTER && !e.shiftKey) {
      e.preventDefault();
      if (value === '') return;
      const object = {
        action: {
          name: 'message',
          type: 'send',
          body: {
            status: 200,
            message: value,
          },
        },
        roomID,
      };

      const stringify = JSON.stringify(object);
      socket.send(stringify);
      this.setState({ value: '' });
      resetHistoryN();
    }

    // TODO: Does not working properly.
    if (
      !(
        selectionEnd === 0 ||
        selectionStart === 0 ||
        selectionEnd === value.length ||
        selectionStart === value.length
      )
    )
      return;
    if (selectionEnd && e.keyCode === KEY_UP) {
      this.historyN = this.historyN - 1;
      if (this.historyN < 0) resetHistoryN();
      const i = this.historyN;
      this.setState({ value: history[i] });
    }
    if (e.keyCode === KEY_DOWN) {
      this.historyN = this.historyN + 1;
      console.log(this.historyN, history.length - 1);
      if (this.historyN > history.length - 1) this.historyN = 0;
      const i = this.historyN;
      this.setState({ value: history[i] });
    }
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
          onChange={this.handleInputChange}
          className="chat-input"
          placeholder=""
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  profile: state.profile,
  history: state.Chat.history,
  roomID: state.MainStates.roomID,
});

const mapDispatchToProps = {
  AppendToHistory: payload => ({ type: APPEND_TO_HISTORY, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChatInput);

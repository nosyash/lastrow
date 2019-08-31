import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import * as types from '../../../constants/ActionTypes';
import * as keys from '../../../constants/keys';
import { MAX_MESSAGE_LENGTH } from '../../../constants';
import * as api from '../../../constants/apiActions';
import { webSocketSend } from '../../../actions';

function ChatInput(props) {
  const [inputValue, setInputValue] = useState('');
  const inputEl = useRef(null);

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  });
  function handleClick(e) {
    const target = e.target.closest('.reply-trigger');
    if (target) {
      const { name } = target.dataset;
      if (name) {
        const value = `@${name} ${inputValue}`;
        setInputValue(value);
      }
      inputEl.current.focus();
    }
  }

  function handleFormSubmit(e) {
    const { socketState, profile } = props;

    if (e.keyCode === keys.ENTER && !e.shiftKey) {
      e.preventDefault();
      const newValue = inputValue.trim();
      if (!socketState || !newValue) return;
      webSocketSend(api.SEND_MESSAGE(newValue, profile.uuid));
      // socket.send(api.SEND_MESSAGE(newValue, profile.uuid));
      setInputValue('');
    }
  }

  function handleInputChange(e) {
    let { value } = e.target;
    if (value.length > MAX_MESSAGE_LENGTH) {
      value = value.substr(0, MAX_MESSAGE_LENGTH);
    }
    setInputValue(value);
  }

  return (
    <div className="chat-input">
      <textarea
        onKeyDown={handleFormSubmit}
        ref={inputEl}
        value={inputValue}
        autoFocus
        placeholder="Write something..."
        onChange={handleInputChange}
        className="chat-input"
      />
    </div>
  );
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

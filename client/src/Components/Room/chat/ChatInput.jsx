import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';
import * as types from '../../../constants/ActionTypes';
import * as keys from '../../../constants/keys';
import { MAX_MESSAGE_LENGTH } from '../../../constants';
import * as api from '../../../constants/apiActions';
import { webSocketSend } from '../../../actions';
import { reverse, mod } from '../../../utils/base';

const KEY_A = 97;
const KEY_Z = 122;
const KEY_0 = 48;
const KEY_9 = 57;
const KEY_UND = 95;
const KEY_CLN = 58;
const KEY_SPC = 32;
const KEY_NL = 10;
const KEY_ESC = 27;
const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_HOME = 36;
const KEY_END = 35;
const KEY_ENTER = 13;
const KEY_TAB = 9;

function isSmileID(c) {
  return (c >= KEY_A && c <= KEY_Z) || (c >= KEY_0 && c <= KEY_9) || c === KEY_UND;
}

function ChatInput(props) {
  const [inputValue, setInputValue] = useState('');
  const [emoteQuery, setEmoteQuery] = useState([]);
  const [queryLen, setQueryLen] = useState(0);
  const [currentEmote, setCurrentEmote] = useState(0);
  const [showEmotes, setShowEmotes] = useState(false);
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

  function onKeyDown(e) {
    const { socketState, profile } = props;

    if (e.keyCode === KEY_ESC) {
      setEmoteQuery([]);
    }

    if (e.keyCode === keys.ENTER && !e.shiftKey && !emoteQuery.length) {
      e.preventDefault();
      const newValue = inputValue.trim();
      if (!socketState || !newValue) return;
      webSocketSend(api.SEND_MESSAGE(newValue, profile.uuid));
      // socket.send(api.SEND_MESSAGE(newValue, profile.uuid));
      setInputValue('');
      return;
    }

    if (!emoteQuery) return;
    const last = emoteQuery.length;
    let cur = currentEmote;

    if (e.keyCode === KEY_UP || (e.shiftKey && e.keyCode === KEY_TAB)) {
      e.preventDefault();
      setCurrentEmote(mod((cur -= 1), last));
    } else if (e.keyCode === KEY_DOWN || e.keyCode === KEY_TAB) {
      e.preventDefault();
      setCurrentEmote(mod((cur += 1), last));
    } else if (e.keyCode === KEY_ENTER && !e.shiftKey) {
      e.preventDefault();
      selectCurrent();
    } else if (
      e.keyCode === KEY_HOME ||
      e.keyCode === KEY_END ||
      e.keyCode === KEY_RIGHT ||
      e.keyCode === KEY_LEFT
    ) {
      setCurrentEmote(0);
      setEmoteQuery([]);
    }
  }

  function autocomplete(el) {
    const { emotesList } = props;
    const start = el.selectionStart;
    const pos = el.selectionEnd;

    if (start !== pos) return null;
    if (pos < 3) return null;

    const body = el.value.toLowerCase();
    const len = body.length;
    const nextCh = pos < len ? body.charCodeAt(pos) : 0;

    if (nextCh && nextCh !== KEY_SPC && nextCh !== KEY_NL) return null;

    let i = pos - 1;
    let chunk = '';
    let colon = false;
    for (; i >= 0; i--) {
      const c = body.charCodeAt(i);
      if (isSmileID(c)) {
        // Append to the end because it's more effecient.
        chunk += body[i];
        // Ignore too long matches.
        if (chunk.length > 10) return null;
      } else if (c === KEY_CLN) {
        colon = true;
        break;
      } else {
        return null;
      }
    }

    setQueryLen(chunk ? chunk.length : 0);
    if (!colon) return null;
    if (chunk.length < 2) return null;
    const prevCh = i > 0 ? body.charCodeAt(i - 1) : 0;
    if (prevCh && prevCh !== KEY_SPC && prevCh !== KEY_NL) return null;

    chunk = reverse(chunk);
    const matches = emotesList.filter(_emote => _emote.name.includes(chunk));
    return matches.length ? matches.slice(0, 10) : null;
  }

  function selectCurrent() {
    const currentEmoteName = emoteQuery[currentEmote];
    if (!currentEmoteName) return;
    pasteEmoteByName(currentEmoteName.name);
  }

  function pasteEmoteByName(name, inPlace) {
    const { selectionEnd, selectionStart } = inputEl.current;
    let inputStart = inputValue.substr(0, selectionEnd - queryLen - 1);

    if (inPlace) inputStart = inputValue.substr(0, selectionEnd);
    const inputEnd = inputValue.substr(selectionEnd);

    setInputValue(`${inputStart}:${name}: ${inputEnd}`);
    setCurrentEmote(0);
    setEmoteQuery([]);
    setShowEmotes(false);
    inputEl.current.focus();
  }

  function handleInputChange(e) {
    let { value } = e.target;
    if (value.length > MAX_MESSAGE_LENGTH) {
      value = value.substr(0, MAX_MESSAGE_LENGTH);
    }
    setInputValue(value);

    const match = autocomplete(inputEl.current);
    setEmoteQuery(match || []);
    setCurrentEmote(0);
  }

  return (
    <div className="chat-input">
      <textarea
        onKeyDown={onKeyDown}
        ref={inputEl}
        value={inputValue}
        autoFocus
        placeholder="Write something..."
        onChange={handleInputChange}
        className="chat-input"
      />
      <div className="emote-search">
        {emoteQuery.map((emote, index) => (
          <span
            onClick={() => pasteEmoteByName(emote.name, true)}
            key={emote.name}
            className={cn([
              'emote-search__emote',
              { 'emote-search__emote_selected': currentEmote === index },
            ])}
          >
            <img src={emote.url} alt={emote.name} title={emote.name} className="emote" />
            <span>:{emote.name}:</span>
          </span>
        ))}
      </div>
      {showEmotes && (
        <EmoteMenu
          list={props.emotesList}
          onClick={name => pasteEmoteByName(name, true)}
        />
      )}
      <span onClick={() => setShowEmotes(!showEmotes)} className="control emote-icon">
        <i className="fa fa-smile"></i>
      </span>
    </div>
  );
}

function EmoteMenu({ list, onClick }) {
  return (
    <div className="emote-menu">
      <div className="emote-menu__scroll">
        {list.map(emote => (
          <span
            key={emote.name + emote.url}
            onClick={() => onClick(emote.name)}
            className="emote-menu__emote"
          >
            <img src={emote.url} alt={emote.name} title={emote.name} className="emote" />
          </span>
        ))}
      </div>
    </div>
  );
}

const mapStateToProps = state => ({
  profile: state.profile,
  history: state.Chat.history,
  roomID: state.MainStates.roomID,
  socketState: state.Chat.connected,
  emotesList: state.emojis.list,
});

const mapDispatchToProps = {
  AppendToHistory: payload => ({ type: types.APPEND_TO_HISTORY, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChatInput);

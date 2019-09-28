import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';
import * as types from '../../../../../constants/actionTypes';
import * as keys from '../../../../../constants/keys';
import { MAX_MESSAGE_LENGTH, MAXIMUM_RECENT_EMOTES } from '../../../../../constants';
import * as api from '../../../../../constants/apiActions';
import { webSocketSend } from '../../../../../actions';
import { reverse, mod } from '../../../../../utils';
import ls from 'local-storage';

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

    function pasteEmoteByName(name: string, inPlace?: boolean) {
        const { selectionEnd } = inputEl.current;
        let inputStart = inputValue.substr(0, selectionEnd - queryLen - 1).trim();
        if (inPlace) inputStart = inputValue.substr(0, selectionEnd).trim();
        const inputEnd = inputValue.substr(selectionEnd).trim();
        // if we're not at the beginning, manually add space before emote;
        if (inputStart) inputStart += ' ';

        handlePopularEmote(name);

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

    function handlePopularEmote(name: string) {
        const { emotesList } = props;
        const emoteObject = emotesList.find(emote => emote.name === name);
        if (!emoteObject) return;

        const popularEmotes = ls('popularEmotes') as any;
        if (!popularEmotes) {
            ls('popularEmotes', []);
            return handlePopularEmote(emoteObject);
        }

        const curEmote = popularEmotes.find((emote) => emote.name === emoteObject.name)
        if (!curEmote) {
            popularEmotes.splice(0, 0, emoteObject)
            // return ls('popularEmotes', popularEmotes)
        } else {
            const index = popularEmotes.indexOf(curEmote);
            popularEmotes.splice(index, 1)
            popularEmotes.splice(0, 0, emoteObject)
        }

        if (popularEmotes.length > 10) {
            popularEmotes.pop()
        }

        ls('popularEmotes', popularEmotes)
        props.updatePopularEmotes(popularEmotes)

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
                id="chat-input"
            />
            <InputTopBar
                onClick={name => pasteEmoteByName(name, true)}
                popularEmotes={props.popularEmotes}
                emotes={props.emotesList}
                toggleShowEmotes={() => setShowEmotes(!showEmotes)} />
            <div className="emote-search">
                {emoteQuery.map((emote, index) => (
                    <span
                        onClick={() => pasteEmoteByName(emote.name)}
                        key={emote.name}
                        className={cn([
                            'emote-search__emote',
                            { 'emote-search__emote_selected': currentEmote === index },
                        ])}
                    >
                        <img src={emote.path} alt={emote.name} title={emote.name} className="emote" />
                        <span>:{emote.name}:</span>
                    </span>
                ))}
            </div>
            {showEmotes && (
                <EmoteMenu
                    onHideMenu={() => setShowEmotes(false)}
                    list={props.emotesList}
                    onClick={name => pasteEmoteByName(name, true)}
                />
            )}
        </div>
    );
}

function InputTopBar({ toggleShowEmotes, onClick, popularEmotes, emotes }) {
    const mapEmoteToName = emotes.map(emote => emote.name);
    const popular = popularEmotes.filter((emote) => mapEmoteToName.includes(emote.name))
    const popularSliced = popular.slice(0, MAXIMUM_RECENT_EMOTES);
    return (
        <div className="chat-input__topbar">
            <div className="chat-input__popular-emotes">
                {popularSliced.map(emote => <img
                    onClick={() => onClick(emote.name, true)}
                    src={emote.path}
                    alt={emote.name}
                    title={emote.name}
                    key={emote.path}
                    className="emote chat-topbar__emote"
                />)}
            </div>
            <span onClick={toggleShowEmotes} className="control emote-icon">
                <i className="fa fa-smile" />
            </span>
        </div>
    )
}

function EmoteMenu({ list, onClick, onHideMenu }) {
    document.removeEventListener('mousedown', handleClick)
    document.addEventListener('mousedown', handleClick)
    function handleClick(e: MouseEvent) {
        console.log('click');
        const target = e.target as HTMLElement
        if (target.closest('.emote-menu') || target.closest('.emote-icon'))
            return;
        onHideMenu();
    }

    const chatEl = document.getElementById('chat-input');
    const { left, width, height, bottom: b } = chatEl.getBoundingClientRect();
    const innerHeight = window.innerHeight;
    const bottom = innerHeight - b + height + 10;
    return (
        <div style={{ left, width, bottom }} className="emote-menu">
            <div className="emote-menu__scroll">
                {list.map(emote => (
                    <span
                        key={emote.name + emote.url}
                        onClick={() => onClick(emote.name)}
                        className="emote-menu__emote"
                    >
                        <img src={emote.path} alt={emote.name} title={emote.name} className="emote" />
                    </span>
                ))}
            </div>
        </div>
    );
}

const mapStateToProps = state => ({
    profile: state.profile,
    history: state.chat.history,
    roomID: state.mainStates.roomID,
    socketState: state.chat.connected,
    emotesList: state.emojis.list,
    popularEmotes: state.emojis.popularEmotes,
});

const mapDispatchToProps = {
    AppendToHistory: payload => ({ type: types.APPEND_TO_HISTORY, payload }),
    updatePopularEmotes: payload => ({ type: types.UPDATE_POPULAR_EMOTE, payload })
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ChatInput);

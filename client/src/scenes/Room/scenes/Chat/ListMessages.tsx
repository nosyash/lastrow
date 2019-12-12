import React, { useState, useEffect, useRef, Fragment } from 'react';
import cn from 'classnames';
import { connect } from 'react-redux';
import Message from './components/Message';
import { isEdge } from '../../../../constants';
import ResizeObserver from 'resize-observer-polyfill'
import { State } from '../../../../reducers';

function ListMessages(props) {
    const [shouldScroll, setShouldScroll] = useState(true);
    // const shouldScrollMutable = useRef(true)
    // const setShouldScroll = (val: boolean) => {
    //     shouldScrollMutable.current = val
    //     setShouldScroll_(val)
    // }

    // const forceScroll = useRef(false)

    const lastScrollPosition = useRef(0);

    const lastScroll = () => lastScrollPosition.current
    const setLastScroll = (val: number) => { lastScrollPosition.current = val }

    const messagesEl = useRef(null) as React.MutableRefObject<HTMLDivElement>
    const getMessagesInner = () => messagesEl.current
    const timer = useRef(null)

    useEffect(() => {
        onMessage()
    }, [props.roomsMessages, props.users]);

    useEffect(() => {

        const resizeObserver = new ResizeObserver(() => {
            clearTimeout(timer.current)
            timer.current = setTimeout(() => {
                scrollToBottom()
            }, 64);
        });

        if (getMessagesInner()) {
            resizeObserver.observe(getMessagesInner());
        }
    }, [])

    function scrollToBottom(cb = () => null) {
        if (!getMessagesInner()) {
            return
        }

        if (isEdge) {
            getMessagesInner().scrollTop = 1000000;
        } else {
            getMessagesInner().scrollTo(0, 1000000);
        }

        setShouldScroll(true)

        cb()
    }

    function onMessage() {
        if (shouldScroll) {
            scrollToBottom()
        }
    }

    function handleScroll() {
        const target = getMessagesInner()
        if (!target) {
            return
        }

        const bottomPosition = target.scrollHeight - target.offsetHeight
        const currentPosition = target.scrollTop

        // TODO: Fix scrolling on old messages remove
        const scrollingUp = lastScroll() > currentPosition

        const reachedBottom = Math.abs(currentPosition - bottomPosition) < 2

        setLastScroll(currentPosition)

        if (scrollingUp) {
            setShouldScroll(false)
        } else if (reachedBottom) {
            setShouldScroll(true)
            scrollToBottom()
        }


    }

    function getSingleMessage(currentMessage, i) {
        const { roomID, selfName, users } = props;
        let renderHeader = true;
        let highlight = false;

        const previousMessage = props.roomsMessages[i - 1];
        const sameAuthorMessage =
            previousMessage && previousMessage.__id === currentMessage.__id;
        if (sameAuthorMessage) {
            renderHeader = false;
        }

        const hasYourName = currentMessage.message.includes(`@${selfName}`);
        const hasEveryone = currentMessage.message.includes(`@everyone`);
        if (hasYourName || hasEveryone) {
            highlight = true;
        }

        const correctRoom = currentMessage.roomID === roomID;
        if (!correctRoom) return null;

        const online = !!users.find(user => user.__id === currentMessage.__id);
        return (
            <Message
                highlight={highlight}
                online={online}
                renderHeader={renderHeader}
                key={currentMessage.id}
                color={currentMessage.color}
                name={currentMessage.name}
                id={currentMessage.__id}
                messageId={currentMessage.id}
                image={currentMessage.image}
                message={currentMessage.message}
                html={currentMessage.html}
            />
        );
    }

    return (
        <Fragment>
            <div
                ref={messagesEl}
                onScroll={handleScroll}
                className='chat-messages'
            >
                {props.roomsMessages.map(getSingleMessage)}
            </div>
            {!shouldScroll && (
                <div
                    onClick={() => scrollToBottom()}
                    className="chat-messages__scroll-to-bottom"
                >
                    Show new messages
                </div>
            )}
        </Fragment>
    );
}

const mapStateToProps = (state: State) => ({
    roomsMessages: state.chat.roomsMessages,
    users: state.chat.users,
    selfName: state.profile.name,
    roomID: state.mainStates.uuid,
});

export default connect(mapStateToProps)(ListMessages);

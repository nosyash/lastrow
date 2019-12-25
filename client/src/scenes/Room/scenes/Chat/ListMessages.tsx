import React, { useState, useEffect, useRef, Fragment } from 'react';
import cn from 'classnames';
import { connect } from 'react-redux';
import Message from './components/Message';
import { isEdge } from '../../../../constants';
import ResizeObserver from 'resize-observer-polyfill'
import { State } from '../../../../reducers';
import { User } from '../../../../utils/types';
import { RoomMessage } from '../../../../reducers/chat';

interface ListMessagesProps {
    roomsMessages: RoomMessage[];
    users: User[];
    selfName: string;
    roomID: string;
}

function ListMessages(props: ListMessagesProps) {
    const [shouldScroll, setShouldScroll] = useState(true);

    const forceScroll = useRef(false)

    const lastScrollPosition = useRef(0);

    const lastScroll = () => lastScrollPosition.current
    const setLastScroll = (val: number) => { lastScrollPosition.current = val }

    const messagesEl = useRef(null) as React.MutableRefObject<HTMLDivElement>
    const getMessagesInner = () => messagesEl.current
    const timer = useRef(null)

    useEffect(() => {
        // When old messages removed, scroll handler might think that we are currently scrolling up.
        // Force scroll until messages finish rendering, so it doesn't happen.
        if (shouldScroll) { forceScroll.current = true }
        requestAnimationFrame(() => { forceScroll.current = false });

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
        return () => {
            resizeObserver.unobserve(getMessagesInner())
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

        const scrollingUp = lastScroll() > currentPosition

        const reachedBottom = Math.abs(currentPosition - bottomPosition) < 2

        setLastScroll(currentPosition)

        if (scrollingUp && !forceScroll.current) {
            setShouldScroll(false)
        } else if (reachedBottom) {
            setShouldScroll(true)
            scrollToBottom()
        }
    }

    return (
        <Fragment>
            <div
                ref={messagesEl}
                onScroll={handleScroll}
                className='chat-messages'
            >
                {props.roomsMessages.map((message) => <Message html={message.html} selfName={props.selfName} key={message.id} />)}
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

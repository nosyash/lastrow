import React, { useState, useEffect, useRef, Fragment } from 'react';
import cn from 'classnames';
import { connect } from 'react-redux';
import Message from './components/Message';
import { isEdge } from '../../../../constants';
import ResizeObserver from 'resize-observer-polyfill'
import { State } from '../../../../reducers';
// import { throttle } from 'lodash'

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

    // const throttleResize = useRef(null)

    useEffect(() => {
        onMessage()
    }, [props.roomsMessages, props.users]);

    useEffect(() => {
        // throttleResize.current = throttle(() => {
        //     if (shouldScrollMutable.current) {
        //         scrollToBottom()
        //         setShouldScroll(true)
        //     }
        //     console.log('thr');

        // }, 1024)

        const resizeObserver = new ResizeObserver(() => {
            // settmi
            // TODO: Handle scroll on resize
            // if (!getMessagesInner()) {
            //     return
            // }
            // // throttleResize.current()
            // const currentPosition = getMessagesInner().scrollTop
            // setLastScroll(currentPosition)
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
                image={currentMessage.image}
                body={currentMessage.message}
            />
        );
    }

    return (
        <Fragment>
            <div
                ref={messagesEl}
                onScroll={handleScroll}
                className={cn(['chat-messages', { 'scroll-smooth': shouldScroll }])}
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

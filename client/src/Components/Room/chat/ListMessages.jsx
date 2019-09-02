import React, { useState, useEffect, useRef, Fragment } from 'react';
import cn from 'classnames';
import { connect } from 'react-redux';
import Message from './Message';
import { isEdge } from '../../../constants';

let event = () => null;
function ListMessages(props) {
  const [shouldScroll, setShouldScroll] = useState(true);
  const messagesEl = useRef(null);

  const { roomsMessages } = props;

  useEffect(() => {
    messagesEl.current.removeEventListener('wheel', event);
    event = () => handleManualScroll();
    messagesEl.current.addEventListener('wheel', event);
    handleAutoScroll();
  }, [props.roomsMessages]);

  function handleManualScroll() {
    const scrolledUp = currentScroll() < amountOfPixelsToBeAtBottom();
    if (scrolledUp) {
      setShouldScroll(false);
    }
  }

  function handleAutoScroll() {
    if (!messagesEl) return;
    if (!shouldScroll) return;
    scrollToBottom();
  }

  function scrollToBottom() {
    if (isEdge) messagesEl.current.scrollTop = 100000;
    else messagesEl.current.scrollTo(0, amountOfPixelsToBeAtBottom());
  }

  function amountOfPixelsToBeAtBottom() {
    return getChatScrollHeight() - getChatOffsetHeight();
  }
  function getChatScrollHeight() {
    return messagesEl.current.scrollHeight;
  }
  function getChatOffsetHeight() {
    return messagesEl.current.offsetHeight;
  }

  function currentScroll() {
    return messagesEl.current.scrollTop;
  }

  function handleToBottomClick() {
    setShouldScroll(true);
    scrollToBottom();
  }

  function getSingleMessage(currentMessage, i) {
    const { roomID, selfName, users } = props;
    let renderHeader = true;
    const previousMessage = roomsMessages[i - 1];
    if (previousMessage && previousMessage.__id === currentMessage.__id) {
      renderHeader = false;
    }

    let highlight = false;
    if (currentMessage.message.includes(`@${selfName}`)) {
      highlight = true;
    }

    if (currentMessage.roomID !== roomID) {
      return null;
    }

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
        className={cn(['chat-messages', { 'scroll-smooth': shouldScroll }])}
      >
        {roomsMessages.map((message, index) => getSingleMessage(message, index))}
      </div>
      {!shouldScroll && (
        <div onClick={handleToBottomClick} className="chat-messages__scroll-to-bottom">
          Enable autoscroll
        </div>
      )}
    </Fragment>
  );
}

const mapStateToProps = state => ({
  roomsMessages: state.Chat.roomsMessages,
  users: state.Chat.users,
  selfName: state.profile.name,
  roomID: state.MainStates.roomID,
});

export default connect(mapStateToProps)(ListMessages);

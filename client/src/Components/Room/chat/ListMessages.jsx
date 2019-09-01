import React, { Component, useMemo } from 'react';
import { connect } from 'react-redux';
import Message from './Message';
import { isEdge } from '../../../constants';

class ListMessages extends Component {
  componentDidUpdate() {
    if (!this.messages) return;
    if (isEdge) this.messages.scrollTop = 100000;
    else this.messages.scrollTo(0, 100000);
  }

  getSingleMessage = (currentMessage, i) => {
    const { roomsMessages, roomID, selfName, users } = this.props;
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
  };

  render() {
    const { roomsMessages, roomID } = this.props;
    return (
      <div ref={ref => (this.messages = ref)} className="chat-messages">
        {roomsMessages.map((message, index) => this.getSingleMessage(message, index))}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  roomsMessages: state.Chat.roomsMessages,
  users: state.Chat.users,
  selfName: state.profile.name,
  roomID: state.MainStates.roomID,
});

export default connect(mapStateToProps)(ListMessages);

import React, { Component } from 'react';
import { connect } from 'react-redux';
import Message from './Message';
import { isEdge } from '../../../constants';

class ListMessages extends Component {
  componentDidUpdate() {
    if (isEdge) this.messages.scrollTop = 100000;
    else this.messages.scrollTo(0, 100000);
  }

  getSingleMessage = (currentMessage, i) => {
    const { list, roomID, selfName, users } = this.props;
    let renderHeader = true;
    const previousMessage = list[roomID][i - 1];
    if (previousMessage && previousMessage.__id === currentMessage.__id) {
      renderHeader = false;
    }
    const nameRegExp = new RegExp(`@${selfName}`);
    let highlight = false;
    if (nameRegExp.test(currentMessage.message)) {
      highlight = true;
    }

    if (currentMessage.roomID !== roomID) {
      return;
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
    const { list, roomID } = this.props;
    const currentList = list[roomID] || [];
    return (
      <div ref={ref => (this.messages = ref)} className="chat-messages">
        {currentList.map((message, index) => this.getSingleMessage(message, index))}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  list: state.Chat.list,
  users: state.Chat.users,
  selfName: state.profile.name,
  roomID: state.MainStates.roomID,
});

export default connect(mapStateToProps)(ListMessages);

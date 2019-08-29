import React, { Component } from 'react';
import { connect } from 'react-redux';
import ChatInput from './ChatInput';
import ListMessages from './ListMessages';
import ChatHeader from './ChatHeader';

class ChatInner extends Component {
  constructor() {
    super();
    this.chatMessages = React.createRef();
  }

  render() {
    const { socket } = this.props;
    return (
      <div className="chat-inner" id="chat-inner">
        <ChatHeader />
        {socket && <ListMessages socket={socket} />}
        <ChatInput socket={socket} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  messages: state.Chat,
  list: state.Chat.list,
  roomID: state.MainStates.roomID,
});

export default connect(mapStateToProps)(ChatInner);

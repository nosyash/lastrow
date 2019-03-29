import React, { Component } from 'react';
import { connect } from 'react-redux';
import ChatInput from './ChatInput';
import ListMessages from './ListMessages';
import ChatHeader from './ChatHeader';
import { ADD_MESSAGE } from '../../../constants/ActionTypes';

class ChatInner_ extends Component {
  constructor() {
    super();
    this.chatMessages = React.createRef();
  }

  render() {
    const { socket } = this.props;
    return (
      <div className="chat-inner">
        <ChatHeader />
        {socket && <ListMessages socket={socket} />}
        <ChatInput socket={socket} />
      </div>
    );
  }
}
function mapStateToProps(state) {
  return {
    messages: state.messages,
    list: state.messages.list,
    roomID: state.MainStates.roomID,
  };
}

export default connect(mapStateToProps)(ChatInner_);

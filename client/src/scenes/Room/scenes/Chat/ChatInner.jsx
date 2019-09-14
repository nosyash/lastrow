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
        return (
            <div className="chat-inner" id="chat-inner">
                <ChatHeader />
                <ListMessages />
                <ChatInput />
            </div>
        );
    }
}

const mapStateToProps = state => ({
    messages: state.chat,
    list: state.chat.list,
    roomID: state.mainStates.roomID,
});

export default connect(mapStateToProps)(ChatInner);

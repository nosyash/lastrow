import React, { Component } from 'react';
import { connect } from 'react-redux';
import ChatInput from './components/ChatInput';
import ListMessages from './ListMessages';
import ChatHeader from './components/ChatHeader';

class ChatInner extends Component {
    chatMessages: React.RefObject<HTMLElement>
    constructor(props) {
        super(props);
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

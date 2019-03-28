import React, { Component } from 'react';
import { connect } from 'react-redux';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import ChatHeader from './ChatHeader';
import { ADD_MESSAGE } from '../../../constants/ActionTypes';

class ChatInner_ extends Component {
  constructor() {
    super();
    this.chatMessages = React.createRef();

    this.state = {
      open: false,
      connected: false,
    };
    this.socket = null;
    this.webSocketConnect();
    this.socket.onopen = () => {
      this.setState({ connected: true });
      console.log('connected');
    };
    this.socket.onmessage = data => this.handleMessage(data);
    this.socket.onerror = () => {
      console.log('error');
      this.webSocketReconnect();
    };
    this.socket.onclose = () => {
      console.log('closed');
      this.webSocketReconnect();
    };
    this.emit = this.emit;
  }

  webSocketConnect = () => {
    const { REACT_APP_SOCKET_ENDPOINT } = process.env;
    this.socket = new WebSocket(REACT_APP_SOCKET_ENDPOINT);
  };

  webSocketReconnect = () => {
    setTimeout(() => {
      this.webSocketConnect();
    }, 1000);
  };

  handleMessage = data => {
    const { action } = JSON.parse(data);
    const { AddMessage } = this.props;
    AddMessage(action);
  };

  emit = () => {
    const { connected } = this.state;
    if (connected) {
      this.socket.send('It worked!');
      this.setState(prevState => ({ open: !prevState.open }));
    }
  };

  componentWillUnmount() {
    this.socket.close();
  }

  render() {
    return (
      <div className="chat-inner">
        <ChatHeader />
        <ChatMessages socket={this.socket} />
        <ChatInput socket={this.socket} />
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  AddMessage: payload => {
    dispatch({ type: ADD_MESSAGE, payload });
  },
});

function mapStateToProps(state) {
  return { messages: state.messages, list: state.messages.list };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChatInner_);

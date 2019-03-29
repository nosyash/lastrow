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

    // this.state = {
    //   open: false,
    //   connected: false,
    // };

    // this.socket = null;
    // this.webSocketConnect();
    // this.socket.onopen = () => {
    //   this.setState({ connected: true });
    //   this.handleConnection();
    // };
    // this.socket.onmessage = data => this.handleMessage(data);
    // this.socket.onerror = () => {
    //   console.log('error');
    //   this.webSocketReconnect();
    // };
    // this.socket.onclose = () => {
    //   console.log('closed');
    //   this.webSocketReconnect();
    // };
  }

  // webSocketConnect = () => {
  //   const { REACT_APP_SOCKET_ENDPOINT: socket } = process.env;
  //   if (socket) this.socket = new WebSocket(socket);
  //   if (!socket) console.error('no websocket address provided');
  // };

  // webSocketReconnect = () => {
  //   setTimeout(() => {
  //     this.webSocketConnect();
  //   }, 1000);
  // };

  // handleMessage = data => {
  //   const { action } = JSON.parse(data.data);
  //   const { AddMessage } = this.props;
  //   AddMessage(action);
  // };

  // handleConnection() {
  //   const { roomI: roomID } = this.props;

  //   const data = {
  //     action: {
  //       name: 'connect',
  //       type: 'register',
  //       body: {
  //         status: 200,
  //         message: '',
  //       },
  //     },
  //     roomID: 'test',
  //   };
  //   // console.log(request);
  //   this.socket.send(JSON.stringify(data));
  // }

  // componentWillUnmount() {
  //   this.socket.close();
  // }

  render() {
    const { socket } = this.props;
    return (
      <div className="chat-inner">
        <ChatHeader />
        {socket && <ChatMessages socket={socket} />}
        <ChatInput socket={socket} />
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
  return {
    messages: state.messages,
    list: state.messages.list,
    roomID: state.MainStates.roomID,
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChatInner_);

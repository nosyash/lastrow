import React, { Component } from 'react';
import { connect } from 'react-redux';
import { WEBSOCKET_TIMEOUT, SOCKET_ENDPOINT, API_ENDPOINT } from '../../constants';
import ChatContainer from './chat/ChatContainer';
import VideoContainer from './video/VideoContainer';
import getEmojiList from '../../utils/InitEmojis';
import * as types from '../../constants/ActionTypes';
import http from '../../utils/httpServices';

class RoomBase extends Component {
  constructor() {
    super();
    this.chat = React.createRef();
    this.video = React.createRef();
    this.divider = React.createRef();
    this.socket = null;
    this.pending = false;
  }

  state = {
    open: false,
    connected: false,
  };

  componentDidMount() {
    this.init();
  }

  componentWillUnmount() {
    const { socket } = this;
    const { clearMessageList } = this.props;

    socket.onclose = () => null;
    socket.close();
    clearMessageList();
  }

  init = async () => {
    let { cinemaMode, volume } = localStorage;
    const { updateMainStates, updatePlayer, match } = this.props;
    const { id } = match.params;

    // Store
    cinemaMode = cinemaMode === 'true';
    volume = volume || 1;
    updateMainStates({ cinemaMode, roomID: id });
    updatePlayer({ volume });
    this.initEmojis();
    this.initWebSocket();
    this.initInfo();
  };

  initWebSocket = () => {
    this.webSocketConnect();
  };

  initWebSocketEvents = () => {
    const { socket } = this;

    socket.onopen = () => this.handleOpen();
    socket.onmessage = data => this.handleMessage(data);
    socket.onerror = () => this.handleError();
    socket.onclose = () => this.handleClose();
  };

  resetWebSocketEvents = (callback?) => {
    const { socket } = this;

    socket.onopen = () => null;
    socket.onmessage = () => null;
    socket.onerror = () => null;
    socket.onclose = () => null;
    if (callback) callback();
  };

  webSocketConnect = () => {
    const { open, connected } = this.state;
    if (open || connected) return;
    if (SOCKET_ENDPOINT) this.socket = new WebSocket(SOCKET_ENDPOINT);
    if (!SOCKET_ENDPOINT) console.error('No WebSocket address was provided');
    this.setState({ open: true });
    this.initWebSocketEvents();
  };

  webSocketReconnect = () => {
    const { connected, open } = this.state;

    if (connected || open || this.pending) return;
    this.pending = true;
    this.webSocketConnect();
    setTimeout(() => {
      if (!this.pending) this.webSocketReconnect();
    }, WEBSOCKET_TIMEOUT);
  };

  handleOpen = () => {
    console.log('WebSocket conection opened');
    this.setState({ open: true });
    this.handleHandShake();
  };

  handleError = () => {
    const { setSocketState } = this.props;

    this.setState({ open: false, connected: false });
    this.pending = false;
    this.resetWebSocketEvents(() => this.webSocketReconnect());

    setSocketState(false);
  };

  handleClose = () => {
    const { setSocketState } = this.props;

    console.log('WebSocket conection closed');
    this.setState({ open: false, connected: false });
    this.resetWebSocketEvents();
    this.pending = false;
    setSocketState(false);
    this.webSocketReconnect();
  };

  handleMessage = d => {
    const { addMessage, roomID } = this.props;

    const { data } = d;
    const { action } = JSON.parse(data);
    console.log(data);
    const { message } = action.body;
    if (message.trim().length === 0) return;
    const messageObject = {
      message: action.body.message,
      name: 'test',
      roomID,
    };
    addMessage(messageObject);
  };

  handleHandShake() {
    const { roomID, setSocketState } = this.props;

    let data = {
      action: {
        name: 'connect',
        type: 'register',
        body: {
          status: 200,
          message: '',
        },
      },
      roomID,
    };
    data = JSON.stringify(data);
    this.socket.send(data);
    this.setState({ connected: true });
    this.pending = false;
    setSocketState(true);
  }

  initEmojis = () => {
    const { addEmojis } = this.props;

    const emojiList = getEmojiList();
    addEmojis(emojiList);
  };

  initInfo = async () => {
    const { updateUserList, match } = this.props;
    const { id: roomID } = match.params;
    if (!roomID) return;
    const data = await http.get(`${API_ENDPOINT}/r/${roomID}`);
    // updateUserList(data.users);
  };

  // handleGlobalClick = e => {
  //   const target = e.target || e.srcElement;
  //   this.handleMatches(target);
  // };

  // handleMatches = target => {
  //   const matches = sel => target.matches(sel);
  //   const closest = sel => target.closest(sel);

  //   if (matches(CHAT_NAME_SEL)) console.log('CHAT_NAME_SEL');
  //   if (closest(USER_ICON_SEL)) console.log('USER_ICON_SEL');
  // };

  render() {
    const { cinemaMode } = this.props;
    return (
      <RenderRoom
        cinemaMode={cinemaMode}
        socket={this.socket}
        divider={this.divider}
        video={this.video}
        chat={this.chat}
      />
    );
  }
}

const RenderRoom = ({ cinemaMode, socket, divider, video, chat }) => (
  <div className="room-container">
    <ChatContainer socket={socket} divider={divider} video={video} chat={chat} />
    {!cinemaMode && <div className="custom-divider" ref={divider} />}
    <VideoContainer videoRef={video} />
  </div>
);

const mapStateToProps = state => ({
  MainStates: state.MainStates,
  cinemaMode: state.MainStates.cinemaMode,
  roomID: state.MainStates.roomID,
  emojiList: state.emojis.list,
  userList: state.Chat.users,
});

const mapDispatchToProps = {
  updateMainStates: payload => ({ type: types.UPDATE_MAIN_STATES, payload }),
  addEmojis: payload => ({ type: types.ADD_EMOJIS, payload }),
  clearMessageList: () => ({ type: types.CLEAR_MESSAGE_LIST }),
  addMessage: payload => ({ type: types.ADD_MESSAGE, payload }),
  updateUserList: payload => ({ type: types.UPDATE_USERLIST, payload }),
  setSocketState: payload => ({ type: types.UPDATE_SOCKET_STATE, payload }),
  updatePlayer: payload => ({ type: types.UPDATE_MEDIA, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomBase);

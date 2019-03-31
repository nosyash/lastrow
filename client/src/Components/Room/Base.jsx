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
    const { ClearMessageList } = this.props;

    socket.onclose = () => null;
    socket.close();
    ClearMessageList();
  }

  init = async () => {
    let { cinemaMode } = localStorage;
    const { UpdateMainStates, match } = this.props;
    const { id } = match.params;

    // Store
    cinemaMode = cinemaMode === 'true';
    UpdateMainStates({ cinemaMode, roomID: id });
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
    // console.log('websocket error');
    this.setState({ open: false, connected: false });
    this.pending = false;
    this.resetWebSocketEvents(() => this.webSocketReconnect());
  };

  handleClose = () => {
    console.log('WebSocket conection closed');
    this.setState({ open: false, connected: false });
    this.resetWebSocketEvents();
    this.pending = false;
    this.webSocketReconnect();
  };

  handleMessage = d => {
    const { AddMessage, roomID } = this.props;

    const { data } = d;
    const { action } = JSON.parse(data);
    const { message } = action.body;
    if (message.trim().length === 0) return;
    const messageObject = {
      message: action.body.message,
      name: 'test',
      roomID,
    };
    AddMessage(messageObject);
  };

  handleHandShake() {
    const { roomID } = this.props;

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
  }

  initEmojis = () => {
    const { AddEmojis } = this.props;

    const emojiList = getEmojiList();
    AddEmojis(emojiList);
  };

  initInfo = async () => {
    const { UpdateUserList, match } = this.props;
    const { id: roomID } = match.params;
    if (!roomID) return;
    const { data } = await http.get(`${API_ENDPOINT}/r/${roomID}`);
    UpdateUserList(data.users);
  };

  toggleCinemaMode = () => {
    const { UpdateMainStates } = this.props;
    const { cinemaMode } = this.props;

    localStorage.cinemaMode = !cinemaMode;
    UpdateMainStates({ cinemaMode: !cinemaMode });
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
      <React.Fragment>
        <div className="room-container">
          <ChatContainer
            socket={this.socket}
            divider={this.divider}
            video={this.video}
            chat={this.chat}
          />
          {!cinemaMode && <div className="custom-divider" ref={this.divider} />}
          <VideoContainer videoRef={this.video}>
            <div className="main-controls">
              {!cinemaMode && <i onClick={this.toggleCinemaMode} className="fas fa-expand" />}
              {cinemaMode && <i onClick={this.toggleCinemaMode} className="fas fa-compress" />}
            </div>
          </VideoContainer>
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => ({
  MainStates: state.MainStates,
  cinemaMode: state.MainStates.cinemaMode,
  roomID: state.MainStates.roomID,
  emojiList: state.emojis.list,
  userList: state.Chat.users,
});

const mapDispatchToProps = {
  UpdateMainStates: payload => ({ type: types.UPDATE_MAIN_STATES, payload }),
  AddEmojis: payload => ({ type: types.ADD_EMOJIS, payload }),
  ClearMessageList: () => ({ type: types.CLEAR_MESSAGE_LIST }),
  AddMessage: payload => ({ type: types.ADD_MESSAGE, payload }),
  UpdateUserList: payload => ({ type: types.UPDATE_USERLIST, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomBase);

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { CHAT_NAME_SEL, USER_ICON_SEL } from '../../constants';
import ChatContainer from './chat/ChatContainer';
import VideoContainer from './video/VideoContainer';
import getEmojiList from '../../utils/InitEmojis';
import * as types from '../../constants/ActionTypes';

class RoomBase_ extends Component {
  constructor() {
    super();
    this.chat = React.createRef();
    this.video = React.createRef();
    this.divider = React.createRef();
    this.socket = null;
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

    socket.onclose = () => null;
    socket.close();
  }

  componentWillMount() {
    const { UpdateMainStates, match } = this.props;
    const { id } = match.params;

    UpdateMainStates({ roomID: id });
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

  webSocketConnect = () => {
    const { REACT_APP_SOCKET_ENDPOINT: socket } = process.env;

    if (socket) this.socket = new WebSocket(socket);
    if (!socket) console.error('no websocket address provided');
    this.initWebSocketEvents();
  };

  webSocketReconnect = () => {
    const { connected } = this.state;
    if (connected) return;
    this.webSocketConnect();
    setTimeout(() => this.webSocketReconnect(), 2000);
  };

  handleOpen = () => {
    console.log('conection opened');
    this.setState({ connected: true });
    this.handleFirstConnect();
  };

  handleMessage = d => {
    const { AddMessage } = this.props;

    const { data } = d;
    const { action } = JSON.parse(data);
    AddMessage(action);
  };

  handleError = () => {
    console.log('error');
    this.webSocketReconnect();
  };

  handleClose = () => {
    console.log('conection closed');
    this.setState({ connected: false });
    this.webSocketReconnect();
  };

  handleFirstConnect() {
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
  }

  initEmojis = () => {
    const { AddEmojis } = this.props;

    const emojiList = getEmojiList();
    AddEmojis(emojiList);
  };

  toggleCinemaMode = () => {
    const { UpdateMainStates } = this.props;
    const { cinemaMode } = this.props;

    localStorage.cinemaMode = !cinemaMode;
    UpdateMainStates({ cinemaMode: !cinemaMode });
  };

  handleGlobalClick = e => {
    const target = e.target || e.srcElement;
    this.handleMatches(target);
  };

  handleMatches = target => {
    const matches = sel => target.matches(sel);
    const closest = sel => target.closest(sel);

    if (matches(CHAT_NAME_SEL)) console.log('CHAT_NAME_SEL');
    if (closest(USER_ICON_SEL)) console.log('USER_ICON_SEL');
  };

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

const RoomBase = connect(
  state => ({
    MainStates: state.MainStates,
    cinemaMode: state.MainStates.cinemaMode,
    emojiList: state.emojis.list,
    roomID: state.MainStates.roomID,
  }),
  dispatch => ({
    UpdateMainStates: payload => {
      dispatch({ type: types.UPDATE_MAIN_STATES, payload });
    },
    AddEmojis: payload => {
      dispatch({ type: types.ADD_EMOJIS, payload });
    },
    AddMessage: payload => {
      dispatch({ type: types.ADD_MESSAGE, payload });
    },
  })
)(RoomBase_);

export default RoomBase;

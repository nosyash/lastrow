import React, { Component } from 'react';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';
import { WEBSOCKET_TIMEOUT, SOCKET_ENDPOINT, toastOpts } from '../../constants';
import ChatContainer from './chat/ChatContainer';
import VideoContainer from './video/VideoContainer';
import getEmojiList from '../../utils/InitEmojis';
import * as types from '../../constants/ActionTypes';
import { roomExist } from '../../utils/apiRequests';
import * as api from '../../constants/apiActions';
import GuestAuth from '../UI/Popups/GuestAuth';

let socket = null;

class RoomBase extends Component {
  constructor() {
    super();
    this.chat = React.createRef();
    this.video = React.createRef();
    this.divider = React.createRef();
    this.timer = null;
  }

  state = {
    exists: false,
  };

  componentDidMount() {
    const { clearPopups, clearUsers } = this.props;
    clearPopups();
    clearUsers();
    this.init();
  }

  componentWillUnmount() {
    // const { socket } = this
    const { clearMessageList, setSocketState } = this.props;
    clearTimeout(this.timer);
    setSocketState(false);
    if (socket) {
      socket.onclose = () => null;
      socket.close();
      console.log('WebSocket conection closed');
    }

    // clearMessageList();
  }

  init = async () => {
    const { match, history } = this.props;
    const { id: roomID } = match.params;

    // Check for room
    const exists = await roomExist(roomID);
    if (!exists) {
      return history.push('/');
    }
    this.setState({ exists: true }, () => {
      this.initStore(() => {
        this.webSocketConnect();
      });
    });
  };

  initStore = callback => {
    const { updateMainStates } = this.props;
    const { match, profile } = this.props;
    const { id: roomID } = match.params;

    let { cinemaMode } = localStorage;
    if (cinemaMode) cinemaMode = JSON.parse(cinemaMode);
    updateMainStates({ cinemaMode, roomID });

    this.initEmojis();

    if (!profile.logged) {
      return this.handleNicknamePopup();
    }

    if (callback) callback();
  };

  handleNicknamePopup = () => {
    const { addPopup } = this.props;
    const id = 'profile-settings';
    addPopup({
      id,
      el: <GuestAuth onSubmit={this.handleGuestAuth} id={id} />,
      width: 500,
      height: 200,
      noBG: true,
    });
  };

  handleGuestAuth = name => {
    const { removePopup, updateProfile } = this.props;
    removePopup('profile-settings');
    updateProfile({ name });
    this.webSocketConnect();
  };

  initWebSocketEvents = () => {
    socket.onopen = () => this.handleOpen();
    socket.onmessage = data => this.handleMessage(data);
    socket.onerror = () => this.handleError();
    socket.onclose = () => this.handleClose();
  };

  resetWebSocketEvents = (callback?) => {
    socket.onopen = () => null;
    socket.onmessage = () => null;
    socket.onerror = () => null;
    socket.onclose = () => null;
    if (callback) callback();
  };

  webSocketConnect = () => {
    if (socket && socket.readyState !== 3) return;
    if (socket) socket = null;
    if (SOCKET_ENDPOINT) socket = new WebSocket(SOCKET_ENDPOINT);
    else console.error('Wrong WebSocket address was provided');
    this.initWebSocketEvents();
  };

  webSocketReconnect = () => {
    clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      this.webSocketConnect();
      if (!this.pending) this.webSocketReconnect();
    }, WEBSOCKET_TIMEOUT);
  };

  handleOpen = () => {
    console.log('WebSocket conection opened');
    this.handleHandShake();
  };

  handleError = () => {
    const { setSocketState } = this.props;

    this.resetWebSocketEvents(() => this.webSocketReconnect());

    setSocketState(false);
  };

  handleClose = () => {
    const { setSocketState } = this.props;

    console.log('WebSocket conection closed');
    this.resetWebSocketEvents();
    setSocketState(false);
    this.webSocketReconnect();
  };

  handleMessage = ({ data: data_ }) => {
    const { addMessage, updateUserList } = this.props;
    const { roomID } = this.props;
    const error = api.GET_ERROR(data_);
    if (error) {
      toast.error(error, { toastId: error, ...toastOpts });
      return this.handleDropConnection();
    }
    const data = api.GET_WS_DATA(data_);
    switch (data.type) {
      case 'message':
        return addMessage({ ...data, roomID });

      case 'user_list':
        return updateUserList(data.users);

      default:
        break;
    }
  };

  handleDropConnection = () => {
    this.resetWebSocketEvents();
    clearTimeout(this.timer);
  };

  handleHandShake() {
    const { setSocketState } = this.props;
    const { roomID, profile } = this.props;
    if (profile.logged) socket.send(api.USER_REGISTER(roomID, profile.uuid));
    else socket.send(api.GUEST_REGISTER(roomID, profile.uuid, profile.name));
    setSocketState(true);
  }

  initEmojis = () => {
    const { addEmojis } = this.props;

    const emojiList = getEmojiList();
    addEmojis(emojiList);
  };

  // initInfo = async () => {
  // const { updateUserList, match } = this.props;
  // const { id: roomID } = match.params;
  // if (!roomID) return;
  // const data = await http.get(api.API_ROOM(roomID));
  // updateUserList(data.users);
  // };

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
    const { cinemaMode, connected } = this.props;
    const { exists } = this.state;
    return (
      exists && (
        <RenderRoom
          connected={connected}
          cinemaMode={cinemaMode}
          divider={this.divider}
          video={this.video}
          chat={this.chat}
        />
      )
    );
  }
}

const RenderRoom = ({ connected, cinemaMode, divider, video, chat }) => (
  <div className="room-container">
    <ChatContainer
      socket={socket}
      connected={connected}
      divider={divider}
      video={video}
      chat={chat}
    />
    {!cinemaMode && <div className="custom-divider" ref={divider} />}
    <VideoContainer videoRef={video} />
  </div>
);

const mapStateToProps = state => ({
  MainStates: state.MainStates,
  connected: state.Chat.connected,
  cinemaMode: state.MainStates.cinemaMode,
  roomID: state.MainStates.roomID,
  emojiList: state.emojis.list,
  userList: state.Chat.users,
  profile: state.profile,
});

const mapDispatchToProps = {
  updateMainStates: payload => ({ type: types.UPDATE_MAIN_STATES, payload }),
  addEmojis: payload => ({ type: types.ADD_EMOJIS, payload }),
  clearMessageList: () => ({ type: types.CLEAR_MESSAGE_LIST }),
  clearUsers: () => ({ type: types.CLEAR_USERS }),
  addMessage: payload => ({ type: types.ADD_MESSAGE, payload }),
  updateUserList: payload => ({ type: types.UPDATE_USERLIST, payload }),
  setSocketState: payload => ({ type: types.UPDATE_SOCKET_STATE, payload }),
  updatePlayer: payload => ({ type: types.UPDATE_MEDIA, payload }),
  addPopup: payload => ({ type: types.ADD_POPUP, payload }),
  removePopup: payload => ({ type: types.REMOVE_POPUP, payload }),
  clearPopups: () => ({ type: types.CLEAR_POPUPS }),
  updateProfile: payload => ({ type: types.UPDATE_PROFILE, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomBase);

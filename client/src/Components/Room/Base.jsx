import React, { Component } from 'react';
import { connect } from 'react-redux';
import ChatContainer from './chat/ChatContainer';
import VideoContainer from './video/VideoContainer';
import getEmojiList from '../../utils/InitEmojis';
import * as types from '../../constants/ActionTypes';
import { roomExist } from '../../utils/apiRequests';
import * as api from '../../constants/apiActions';
import GuestAuth from '../UI/Popups/GuestAuth';
import Divider from './Divider';
import { webSocketConnect, webSocketDisconnect } from '../../actions';

// const socket = null;

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
    webSocketDisconnect();
  }

  init = async () => {
    const { match, history } = this.props;
    const { id: roomID } = match.params;

    // Check for room
    const exists = await roomExist(roomID);
    if (!exists) {
      return history.push('/');
    }
    this.setState({ exists: true }, () => this.initStore(this.initWebsocket));
  };

  initWebsocket = () => {
    const { match, profile } = this.props;
    const { id: roomID } = match.params;
    webSocketConnect({ roomID, uuid: profile.uuid });
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
    const { togglePopup } = this.props;
    togglePopup('guestAuth');
  };

  // TODO: Move to GuestAuth component
  handleGuestAuth = name => {
    const { removePopup, updateProfile } = this.props;
    removePopup('profile-settings');
    updateProfile({ name });
  };

  initEmojis = () => {
    const { addEmojis } = this.props;

    const emojiList = getEmojiList();
    addEmojis(emojiList);
  };

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
    <ChatContainer connected={connected} divider={divider} video={video} chat={chat} />
    {/* {!cinemaMode && <div className="custom-divider" ref={divider} />} */}
    <Divider />
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
  setSocketState: payload => ({ type: types.SET_SOCKET_CONNECTED, payload }),
  updatePlayer: payload => ({ type: types.UPDATE_MEDIA, payload }),
  togglePopup: payload => ({ type: types.TOGGLE_POPUP, payload }),
  removePopup: payload => ({ type: types.REMOVE_POPUP, payload }),
  clearPopups: () => ({ type: types.CLEAR_POPUPS }),
  updateProfile: payload => ({ type: types.UPDATE_PROFILE, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomBase);

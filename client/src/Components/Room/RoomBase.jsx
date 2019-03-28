import React, { Component } from 'react';
import { connect } from 'react-redux';
import { CHAT_NAME_SEL, USER_ICON_SEL } from '../../constants';
import ChatContainer from './chat/ChatContainer';
import VideoContainer from './video/VideoContainer';
import getEmojiList from '../../utils/InitEmojis';
import http from '../../utils/httpServices';

class RoomBase_ extends Component {
  constructor() {
    super();
    this.chat = React.createRef();
    this.video = React.createRef();
    this.divider = React.createRef();
  }

  state = {};

  componentDidMount() {
    this.init();
  }

  componentWillUnmount() {}

  componentWillMount() {
    const { UpdateMainStates, match } = this.props;
    const { id } = match.params;
    UpdateMainStates({ roomId: id });
  }

  init = async () => {
    let { cinemaMode } = localStorage;
    const { UpdateMainStates, match } = this.props;
    const { id } = match.params;
    const { REACT_APP_SOCKET_ENDPOINT } = process.env;

    cinemaMode = cinemaMode === 'true';

    // Store
    UpdateMainStates({ cinemaMode, roomId: id });

    // Request connection
    // const data = {
    // action: {
    // name: 'connect',
    // type: 'register',
    // body: {
    // status: 200,
    // message: '',
    // },
    // },
    // roomID: id,
    // };

    // // console.log(request);
    // socket.send(JSON.stringify(data));

    // States
    this.initEmojis();
  };

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
          <ChatContainer divider={this.divider} video={this.video} chat={this.chat} />
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
  }),
  dispatch => ({
    UpdateMainStates: payload => {
      dispatch({ type: 'UPDATE_MAIN_STATES', payload });
    },
    AddEmojis: payload => {
      dispatch({ type: 'ADD_EMOJIS', payload });
    },
  })
)(RoomBase_);

export default RoomBase;

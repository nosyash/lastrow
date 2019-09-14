import React, { Component } from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';
import ChatContainer from './scenes/Chat/index';
import VideoContainer from './scenes/Media/index';
import getEmojiList from '../../utils/InitEmojis';
import * as types from '../../constants/actionTypes';
import { requestRoom } from '../../utils/apiRequests';
import Divider from './components/Divider';
import { webSocketConnect, webSocketDisconnect } from '../../actions';
import notifications from '../../utils/notifications';
import { GUEST_AUTH, PROFILE_SETTINGS, PLAYLIST } from '../../constants';
import { Emoji } from '../../reducers/emojis';

// Authorize before render room
function RoomBaseWrapper(props) {
    const { addPopup } = props;
    const { logged, guest } = props.profile;

    if (guest && !logged) {
        addPopup(GUEST_AUTH);
        return null;
    }
    return <RoomBase {...props} />;
}

interface RoomBaseProps {
    match: any;
    profile: any;
    history: any;
    cinemaMode: boolean;
    connected: boolean;
    clearPopups: () => void;
    clearUsers: () => void;
    updateMainStates: (...args: any) => any;
    updateProfile: (...args: any) => void;
    addEmojis: (emojis: Emoji[]) => void;
    removePopup: (popup: string) => void;
    togglePopup: (popup: string) => void;
}

class RoomBase extends Component<RoomBaseProps, any> {
    chat: React.RefObject<any>;
    video: React.RefObject<any>;
    divider: React.RefObject<any>;
    timer: NodeJS.Timeout;
    constructor(props: RoomBaseProps) {
        super(props);
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
        document.addEventListener('keydown', this.handleKeyDown)
        clearPopups();
        clearUsers();
        this.init();
    }

    componentWillUnmount() {
        webSocketDisconnect();
    }

    handleKeyDown = ({ altKey, code, keyCode, ctrlKey }: KeyboardEvent) => {
        const { togglePopup } = this.props;
        if (altKey) {
            switch (code) {
                case 'KeyP': return togglePopup(PLAYLIST)
                case 'KeyF': return // TODO: handleFullScreen
                // TODO: markup hotkeys
                default: return;
            }
        }

        if (!ctrlKey)
            return this.focusInput();
    }

    focusInput() {
        const input = document.getElementById('chat-input');
        const { activeElement } = document;
        const activeElementTag = activeElement.tagName.toLowerCase();
        if (activeElementTag !== 'input' && activeElementTag !== 'textarea')
            if (input) input.focus();

    }

    init = async () => {
        const { match, history } = this.props;
        const { id: roomID } = match.params;

        // Check for room
        const room = await requestRoom(roomID);
        if (!room)
            return history.push('/');

        document.title = room.title;
        notifications.setCurrentTitle(document.title);
        this.setState({ exists: true }, () => this.initStore(this.initWebsocket));
    };

    initWebsocket = () => {
        const { match } = this.props;
        const { id: roomID } = match.params;
        webSocketConnect({ roomID });
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
        togglePopup(GUEST_AUTH);
    };

    // TODO: Move to GuestAuth component
    handleGuestAuth = (name: string) => {
        const { removePopup, updateProfile } = this.props;
        removePopup(PROFILE_SETTINGS);
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
                    divider={this.divider}
                    video={this.video}
                    chat={this.chat}
                />
            )
        );
    }
}

interface RenderRoomProps {
    connected: boolean;
    divider: React.RefObject<any>;
    video: React.RefObject<any>;
    chat: React.RefObject<any>;
}

const RenderRoom = ({ connected, divider, video, chat }: RenderRoomProps) => (
    <div className={cn(['room-container', { 'room-container_disconected': !connected }])}>
        <ChatContainer connected={connected} divider={divider} video={video} chat={chat} />
        {/* {!cinemaMode && <div className="custom-divider" ref={divider} />} */}
        <Divider />
        <VideoContainer videoRef={video} />
    </div>
);

const mapStateToProps = state => ({
    mainStates: state.mainStates,
    connected: state.chat.connected,
    currentRoomID: state.chat.currentRoomID,
    cinemaMode: state.mainStates.cinemaMode,
    roomID: state.mainStates.roomID,
    emojiList: state.emojis.list,
    userList: state.chat.users,
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
    addPopup: payload => ({ type: types.ADD_POPUP, payload }),
    clearPopups: () => ({ type: types.CLEAR_POPUPS }),
    updateProfile: payload => ({ type: types.UPDATE_PROFILE, payload }),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RoomBaseWrapper);

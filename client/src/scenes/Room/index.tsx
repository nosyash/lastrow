import React, { Component } from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';
import ChatContainer from './scenes/Chat/index';
import VideoContainer from './scenes/Media/index';
import * as types from '../../constants/actionTypes';
import Divider from './components/Divider';
import { webSocketConnect, webSocketDisconnect, setRoomData } from '../../actions';
import notifications from '../../utils/notifications';
import { GUEST_AUTH, PROFILE_SETTINGS, PLAYLIST } from '../../constants';
import { Emoji } from '../../reducers/emojis';
import { Role } from '../../reducers/profile';
import { PermissionsMap } from '../../reducers/rooms';
import { State } from '../../reducers';

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
    room_uuid: string;
    roles: Role[];
    clearPopups: () => void;
    clearUsers: () => void;
    updateMainStates: (...args: any) => any;
    updateProfile: (...args: any) => void;
    addEmojis: (emojis: Emoji[]) => void;
    removePopup: (popup: string) => void;
    togglePopup: (popup: string) => void;
    setCurrentLevel: (level: PermissionsMap) => void;
    toggleCinemaMode: () => void;
    toggleSync: () => void;
}

class RoomBase extends Component<RoomBaseProps, any> {
    timer: NodeJS.Timeout;
    constructor(props: RoomBaseProps) {
        super(props);
        this.timer = null;
    }

    state = {
        exists: false,
        visible: false,
    };

    componentDidMount() {
        const { clearPopups, clearUsers } = this.props;
        document.addEventListener('keydown', this.handleKeyDown)
        clearPopups();
        clearUsers();
        this.init();

        setTimeout(() => {
            this.setState({ visible: true })
        }, 100);
    }

    componentWillUnmount() {
        webSocketDisconnect();
        document.removeEventListener('keydown', this.handleKeyDown)
    }

    handleKeyDown = (e: KeyboardEvent) => {
        const usedKeys = ['KeyP', 'KeyC', 'KeyS']
        const { altKey, code, ctrlKey, metaKey, keyCode } = e;
        const ESCAPE = keyCode === 27

        if (altKey) {
            if (usedKeys.includes(code)) e.preventDefault();
            switch (code) {
                case 'KeyP': return this.props.togglePopup(PLAYLIST)
                case 'KeyC': return this.props.toggleCinemaMode()
                case 'KeyS': return this.props.toggleSync()
                default: return;
            }
        }

        if (!metaKey && !ESCAPE && !ctrlKey && !code.includes('Arrow')) {
            this.focusInput();
        }
    }


    focusInput() {
        const input = document.getElementById('chat-input');
        const { activeElement } = document;
        const activeElementTag = activeElement.tagName.toLowerCase();
        if (activeElementTag !== 'input' && activeElementTag !== 'textarea')
            if (input) input.focus();

    }

    init = async () => {
        const { match, history, updateMainStates } = this.props;
        const { id: roomID } = match.params;

        // Check for room existence
        updateMainStates({ roomID })
        setRoomData()
            .then(() => {
                notifications.setCurrentTitle(document.title);
                this.setState({ exists: true }, () => this.initStore(this.initWebsocket));
                this.saveCurrentLevel()
            })
            .catch(() => history.push('/'))
    };

    saveCurrentLevel() {
        const { room_uuid, roles, setCurrentLevel, profile } = this.props;
        if (profile.guest) {
            setCurrentLevel(0)
            return
        }

        const currentRole = roles.find(role => role.room_uuid === room_uuid)
        if (currentRole) {
            setCurrentLevel(currentRole.Level)
            return
        }
        setCurrentLevel(1)
    }

    initWebsocket = () => webSocketConnect({ room_uuid: this.props.room_uuid });;

    initStore = callback => {
        const { updateMainStates } = this.props;
        const { match, profile } = this.props;
        const { id: roomID } = match.params;

        updateMainStates({ roomID });

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

    render() {
        const { cinemaMode, connected } = this.props;
        const { exists, visible } = this.state;
        return (
            exists && (
                <RenderRoom
                    cinemaMode={cinemaMode}
                    connected={connected}
                    visible={visible}
                />
            )
        );
    }
}

interface RenderRoomProps {
    connected: boolean;
    visible: boolean;
    cinemaMode: boolean;
}

const RenderRoom = ({ connected, visible, cinemaMode }: RenderRoomProps) => (
    <div className={cn(['room-container', { 'room-container_disconected': !connected, 'is-visible': visible }])}>
        {!cinemaMode && <ChatContainer />}
        {/* {!cinemaMode && <div className="custom-divider" ref={divider} />} */}
        {!cinemaMode && <Divider />}
        <VideoContainer />
    </div>
);

const mapStateToProps = (state: State) => ({
    mainStates: state.mainStates,
    connected: state.chat.connected,
    cinemaMode: state.mainStates.cinemaMode,
    roomID: state.mainStates.roomID,
    room_uuid: state.mainStates.uuid,
    emojiList: state.emojis.list,
    userList: state.chat.users,
    profile: state.profile,
    roles: state.profile.roles,
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
    setCurrentLevel: payload => ({ type: types.SET_CURRENT_LEVEL, payload }),
    toggleCinemaMode: () => ({ type: types.TOGGLE_CINEMAMODE }),
    toggleSync: () => ({ type: types.TOGGLE_SYNC })
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RoomBaseWrapper);

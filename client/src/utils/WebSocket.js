import { get } from 'lodash';
import * as api from '../constants/apiActions';
import * as types from '../constants/actionTypes';
import { store } from '../store';
import { sortPlaylistByIndex } from '.';
import { toast } from 'react-toastify';
import { toastOpts } from '../Conf';

const { dispatch } = store;

class Socket {
    constructor({ url, roomID, uuid, guest, name }) {
        this.url = url;
        this.guest = guest;
        this.name = name;
        this.roomID = roomID;
        this.uuid = uuid;

        this.timer = null;
        this.reconnectTimer = null;
        this.initWebSocket();
    }

initWebSocket = () => {
    this._resetStates();
    this.instance = new WebSocket(this.url);
    this._listen();
};

state = () => {
    return new Promise((resolve, reject) => {
        this.timer = setInterval(() => {
            const { readyState } = this.instance;

            if (this._getReadyState(readyState) === 'CLOSED') {
                dispatch({ type: types.SET_SOCKET_CONNECTED, payload: false });
                dispatch({ type: types.SET_SOCKET_ERROR, payload: true });
                clearInterval(this.timer);
                reject();
            }
            if (this._getReadyState(readyState) === 'OPEN') {
                clearInterval(this.timer);
                resolve();
            }
        }, 50);

        setTimeout(() => {
            clearInterval(this.timer);
            reject();
        }, 15000);
    });
};

sendMessage = (dataToSend, messageTypeToGet, cb) => {
    let timeout = null;

    const onMessageLocal = ({ data: receivedData }) => {
        const data = JSON.parse(receivedData);
        if (get(data, 'body.event.type') !== messageTypeToGet) return;

        this._removeEvent('message', onMessageLocal);
        clearTimeout(timeout);

        return cb(true, null);
    };

    if (messageTypeToGet) {
        this.instance.addEventListener('message', onMessageLocal);
        timeout = setTimeout(() => {
            this._removeEvent('message', onMessageLocal);
            return cb(null, true);
        }, 15000);
    }

    this.instance.send(dataToSend);
};

destroy = () => {
    this._unsubscribeEvents();
    this.instance.close();
    this._resetStates();
};

_removeEvent = (event, callback) => {
    this.instance.removeEventListener(event, callback);
};

_getReadyState = readyState => {
    switch (readyState) {
    case 0:
        return 'CONNECTING';
    case 1:
        return 'OPEN';
    case 2:
        return 'CLOSING';
    case 3:
        return 'CLOSED';

    default:
        break;
    }
};

_resetStates = () => {
    dispatch({ type: types.SET_SOCKET_CONNECTED, payload: false });
    dispatch({ type: types.SET_SOCKET_ERROR, payload: false });
};

_listen = () => {
    this.instance.onopen = () => this._handleOpen();
    this.instance.onmessage = data => this._handleMessage(data);
    this.instance.onerror = () => this._handleError();
    this.instance.onclose = () => this._handleClose();
};

_handleOpen = () => {
    console.log('WebSocket conection opened');
    this._handleHandshake();
};

_handleHandshake() {
    if (!this.guest) {
        this.instance.send(api.USER_REGISTER(this.roomID, this.uuid));
    } else {
        this.instance.send(api.GUEST_REGISTER(this.roomID, this.uuid, this.name));
    }
    dispatch({ type: types.SET_SOCKET_CONNECTED, payload: true });
}

_handleMessage = ({ data }) => {
    const parsedData = JSON.parse(data);
    const eventType = get(parsedData, 'body.event.type');

    switch (eventType) {
    case 'update_users': {
        const users = get(parsedData, 'body.event.data.users');
        return dispatch({ type: types.UPDATE_USERLIST, payload: users });
    }
    case 'message': {
        const message = get(parsedData, 'body.event.data');
        const payload = { ...message, roomID: this.roomID };
        return dispatch({ type: types.ADD_MESSAGE, payload });
    }
    case 'update_playlist': {
        const videos = get(parsedData, 'body.event.data.videos');
        const playlist = sortPlaylistByIndex(videos || []);
        return dispatch({ type: types.ADD_TO_PLAYLIST, payload: playlist });
    }
    case 'ticker': {
        const payload = { actualTime: data.elapsed_time };
        return dispatch({ type: types.UPDATE_MEDIA, payload });
    }
    case 'feedback': {
        const message = get(parsedData, 'body.event.data.feedback.message');
        const error = get(parsedData, 'body.event.data.feedback.error');
        if (message === 'success')
            return setAddMediaToSuccess();
        if (error) {
            stopAddMediaPending()
            toast.warn(error, toastOpts);
        }
    }
    default:
        break;
    }
};

_handleError = () => {
    this.handleReconnect();
};

_handleClose = () => {
    console.log('WebSocket conection closed');
    this.handleReconnect();
};

handleReconnect = () => {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
        this.initWebSocket();
    }, 1000);
};

_unsubscribeEvents = () => {
    this.instance.onopen = () => null;
    this.instance.onmessage = () => null;
    this.instance.onerror = () => null;
    this.instance.onclose = () => null;
};

    // _webSocketReconnect = () => {
    //   clearTimeout(this.timer);

    //   this.timer = setTimeout(() => {
    //     if (!this.pending) this._webSocketReconnect();
    //   }, WEBSOCKET_TIMEOUT);
    // };
}

const setAddMediaToSuccess = () => {
    dispatch({ type: types.REMOVE_POPUP, payload: 'addMedia' });
    stopAddMediaPending();
};

const stopAddMediaPending = () => {
    dispatch({ type: types.SET_ADD_MEDIA_PENDING, payload: false });
};

export default Socket;

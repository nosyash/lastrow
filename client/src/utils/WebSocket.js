import * as api from '../constants/apiActions';
import * as types from '../constants/ActionTypes';
import { store } from '../store';
import { sortPlaylistByIndex } from './base';

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
      const dataFormated = this.getDataFromMessage(receivedData);
      if (dataFormated.type !== messageTypeToGet) return;

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

  getDataFromMessage = data => {
    const error = api.GET_ERROR(data);
    if (error) {
      console.log(error);
      return;
    }
    return api.GET_WS_DATA(data);
  };

  _handleMessage = ({ data: data_ }) => {
    const data = this.getDataFromMessage(data_);
    if (!data) return;
    switch (data.type) {
      case 'message': {
        const payload = { ...data, roomID: this.roomID };
        return dispatch({ type: types.ADD_MESSAGE, payload });
      }

      case 'user_list': {
        return dispatch({ type: types.UPDATE_USERLIST, payload: data.users });
      }

      case 'ticker': {
        return dispatch({
          type: types.UPDATE_MEDIA,
          payload: { actualTime: data.elapsed_time },
        });
      }

      case 'playlist': {
        const playlist = sortPlaylistByIndex(data.videos);
        return dispatch({ type: types.ADD_TO_PLAYLIST, payload: playlist });
      }

      case 'added_to_playlist': {
        return setAddMediaToSuccess();
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
  dispatch({ type: types.SET_ADD_MEDIA_PENDING, payload: false });
};

export default Socket;

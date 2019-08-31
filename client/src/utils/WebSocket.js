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

  sendMessage = data => {
    this.instance.send(data);
  };

  destroy = () => {
    this._unsubscribeEvents();
    this.instance.close();
    this._resetStates();
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

  _handleMessage = ({ data: data_ }) => {
    const error = api.GET_ERROR(data_);
    if (error) {
      console.log(error);
      return;
      // return this._resetStates();
    }
    const data = api.GET_WS_DATA(data_);
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

export default Socket;

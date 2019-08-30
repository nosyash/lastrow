import axios from 'axios';
import { parse } from 'subtitle';
import { SET_SUBS } from '../constants/ActionTypes';
import http from '../utils/httpServices';

import Socket from '../utils/WebSocket';
import { store } from '../store';
import { SOCKET_ENDPOINT } from '../constants';

export const fetchSubs = url => dispatch => {
  return http
    .get(url)
    .then(response => {
      dispatch({ type: SET_SUBS, payload: { srt: parse(response.data) } });
    })
    .catch(error => {
      throw error;
    });
};

let socket = null;

export const webSocketConnect = ({ roomID }) => {
  const { uuid, name, guest } = store.getState().profile;
  const url = SOCKET_ENDPOINT;
  socket = new Socket({ url, roomID, uuid, guest, name });
  return socket.state();
};

export const webSocketSend = data => {
  return socket
    .state()
    .then(() => socket.sendMessage(data))
    .catch(() => alert('socket connection closed'));
};

export const webSocketDisconnect = () => {
  if (socket) socket.destroy();
};

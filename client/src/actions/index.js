import axios from 'axios';
import { parse } from 'subtitle';
import { toast } from 'react-toastify';
import http from '../utils/httpServices';
import * as api from '../constants/apiActions';
import * as types from '../constants/ActionTypes';

import Socket from '../utils/WebSocket';
import { store } from '../store';
import { SOCKET_ENDPOINT, toastOpts } from '../constants';

export const fetchSubs = url => dispatch => {
  return http
    .get(url)
    .then(response => {
      dispatch({ type: types.SET_SUBS, payload: { srt: parse(response.data) } });
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
    .catch(() => alert('something went wrong in websocket'));
};

export const webSocketDisconnect = () => {
  if (socket) socket.destroy();
};

export const requestColorUpdate = color => async dispatch => {
  // const { updateProfile } = this.props;
  const res = await http.post(api.API_USER(), api.UPDATE_USER('', color));

  if (!res.data) {
    toast.error('There was an error updating your color...', toastOpts);
    return;
  }
  toast.success('Color successfully changed', toastOpts);

  dispatch({ type: types.UPDATE_PROFILE, payload: { ...res.data } });
  return Promise.resolve();
};

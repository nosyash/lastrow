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

/** @type Socket */
let socket = null;

export const webSocketConnect = ({ roomID }) => {
  const { uuid, name, guest } = store.getState().profile;

  if (!isConnectingSameRoom()) webSocketDisconnect();

  socket = new Socket({ url: SOCKET_ENDPOINT, roomID, uuid, guest, name });
  return socket.state();
};

const isConnectingSameRoom = roomID => (socket ? roomID === socket.roomID : false);

export const webSocketSend = (data, messageTypeToGet = '', cb = () => null) => {
  return socket.sendMessage(data, messageTypeToGet, cb);
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

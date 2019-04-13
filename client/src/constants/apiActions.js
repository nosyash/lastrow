/* eslint-disable camelcase */
import { API_ENDPOINT } from '../constants';

export const API_AUTH = () => `${API_ENDPOINT}/auth`;
export const API_ROOM = roomID => `${API_ENDPOINT}/r/${roomID}`;
export const API_ROOMS = () => `${API_ENDPOINT}/rooms`;
export const API_USER = () => `${API_ENDPOINT}/user`;

export const ROOM_CREATE = (title, path) =>
  JSON.stringify({
    action: 'room_create',
    body: { title, path },
  });

export const LOG_OUT = () =>
  JSON.stringify({
    action: 'logout',
    body: { uname: '', passwd: '', email: '' },
  });

export const LOG_IN = (uname, passwd, email) =>
  JSON.stringify({
    action: 'login',
    body: { uname, passwd, email },
  });

export const REG = (uname, passwd, email) =>
  JSON.stringify({
    action: 'register',
    body: { uname, passwd, email },
  });

export const UPDATE_IMAGE = raw_img =>
  JSON.stringify({
    action: 'user_update_img',
    body: {
      image: {
        type: '.jpg',
        raw_img,
      },
    },
  });

export const UPDATE_USER = (name = '', color = '') =>
  JSON.stringify({
    action: 'user_update_per',
    body: {
      name,
      color,
    },
  });

export const UPDATE_PASSWORD = (cur_passwd, new_passwd) =>
  JSON.stringify({
    action: 'user_update_pswd',
    body: {
      cur_passwd,
      new_passwd,
    },
  });

// WebSocket
export const USER_REGISTER = (room_id, user_uuid) =>
  JSON.stringify({
    action: 'user_register',
    room_id,
    user_uuid,
  });

export const GUEST_REGISTER = (room_id, user_uuid, name) =>
  JSON.stringify({
    action: 'guest_register',
    room_id,
    name,
    user_uuid,
  });

export const SEND_MESSAGE = (message, user_uuid) =>
  JSON.stringify({
    action: 'user_event',
    body: {
      event: {
        type: 'message',
        data: {
          message,
        },
      },
    },
    user_uuid,
  });

export const GET_WS_DATA = json => {
  const obj = JSON.parse(json);
  if (obj.users || obj.users === null) {
    return { type: 'user_list', users: obj.users ? obj.users : [] };
  }
  const { event } = obj.body;
  const { type } = event;
  return { type, ...event.data };
};

export const GET_ERROR = json => {
  const obj = JSON.parse(json);
  if (obj.error) return obj.error;
};

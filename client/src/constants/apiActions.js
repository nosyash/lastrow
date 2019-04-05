import { API_ENDPOINT } from '../constants';

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

export const SEND_MESSAGE = (message, roomID) =>
  JSON.stringify({
    action: {
      name: 'message',
      type: 'send',
      body: { status: 200, message },
    },
    roomID,
  });

export const WS_HANDSHAKE = roomID =>
  JSON.stringify({
    action: {
      name: 'connect',
      type: 'register',
      body: { status: 200, message: '' },
    },
    roomID,
  });

export const API_AUTH = () => `${API_ENDPOINT}/auth`;
export const API_ROOM = roomID => `${API_ENDPOINT}/r/${roomID}`;
export const API_ROOMS = () => `${API_ENDPOINT}/rooms`;
export const API_USER = () => `${API_ENDPOINT}/user`;

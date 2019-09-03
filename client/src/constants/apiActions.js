/* eslint-disable camelcase */
import { API_ENDPOINT } from '../constants';

export const API_AUTH = () => `${API_ENDPOINT}/auth`;
export const API_ROOM = roomID => `${API_ENDPOINT}/r/${roomID}`;
export const API_ROOMS = () => `${API_ENDPOINT}/room`;
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

// ####################
//      WebSocket
// ####################
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

// "__id": "00558ab4060d4a8391c2f38757930ef6f9ae8f7dc030e3a28d5e052d7703dc82",
// "duration": 2359,
// "elapsed_time": 0

// {
//   "videos": [
//     {
//       "title": "[V LIVE] [UZZU TAPE (우쭈테잎)] EP. 16 경복궁 야간기행, 시간의 다리를 건너다!",
//       "duration": 2359,
//       "url": "https://stream.bona.cafe/uzzu/ep15.mp4",
//       "index": 0,
//       "__id": "00558ab4060d4a8391c2f38757930ef6f9ae8f7dc030e3a28d5e052d7703dc82"
//     }
//   ]
// }

export const GET_WS_DATA = json => {
  const obj = JSON.parse(json);
  if (obj.users || obj.users === null) {
    return { type: 'user_list', users: obj.users ? obj.users : [] };
  }
  if (obj.ticker) {
    return { type: 'ticker', ...obj.ticker };
  }

  if (obj.videos) {
    return { type: 'playlist', videos: obj.videos };
  }

  if (obj.message) {
    return { type: '' };
  }
  const { event } = obj.body;
  if (!event) return { type: '' };
  const { type } = event;
  return { type, ...event.data };
};

export const GET_ERROR = json => {
  const obj = JSON.parse(json);
  if (obj.error) return obj.error;
};

export const SEND_MEDIA_TO_PLAYLIST = ({ url, uuid }) => {
  const request = {
    action: 'player_event',
    body: {
      event: {
        type: 'playlist_add',
        data: {
          url,
        },
      },
    },
    user_uuid: uuid,
  };

  return JSON.stringify(request);
};

export const DELETE_VIDEO_FROM_PLAYLIST = ({ __id, uuid }) => {
  const request = {
    action: 'player_event',
    body: {
      event: {
        type: 'playlist_del',
        data: {
          __id,
        },
      },
    },
    user_uuid: uuid,
  };

  return JSON.stringify(request);
};

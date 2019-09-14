/* eslint-disable camelcase */
import { API_ENDPOINT } from '../constants';
import { Message } from '../utils/types';
import { PasswordChange, WebSocketRegister, WebSocketGuestRegister, SendMediaToPlaylist, DeleteMediaFromPlaylist } from './types';

export const API_AUTH = () => `${API_ENDPOINT}/auth`;
export const API_ROOM = (roomID: string) => `${API_ENDPOINT}/r/${roomID}`;
export const API_ROOMS = () => `${API_ENDPOINT}/room`;
export const API_USER = () => `${API_ENDPOINT}/user`;

export const ROOM_CREATE = (title: string, path: string) =>
    JSON.stringify({
        action: 'room_create',
        body: { title, path },
    } as Message);

export const LOG_OUT = () =>
    JSON.stringify({
        action: 'logout',
        body: { uname: '', passwd: '', email: '' },
    } as Message);

export const LOG_IN = (uname: string, passwd: string, email: string) =>
    JSON.stringify({
        action: 'login',
        body: { uname, passwd, email },
    } as Message);

export const REG = (uname: string, passwd: string, email: string) =>
    JSON.stringify({
        action: 'register',
        body: { uname, passwd, email },
    } as Message);

export const UPDATE_IMAGE = (raw_img: string) =>
    JSON.stringify({
        action: 'user_update_img',
        body: {
            image: {
                type: '.jpg',
                raw_img,
            },
        },
    } as Message);

export const UPDATE_USER = (name = '', color = '') =>
    JSON.stringify({
        action: 'user_update_per',
        body: {
            name,
            color,
        },
    } as Message);

export const UPDATE_PASSWORD = ({ cur_passwd, new_passwd }: PasswordChange) =>
    JSON.stringify({
        action: 'user_update_pswd',
        body: {
            cur_passwd,
            new_passwd,
        },
    } as Message);

// ####################
//      WebSocket
// ####################
export const USER_REGISTER = (room_id: string, user_uuid: string) =>
    JSON.stringify({
        action: 'user_register',
        room_id,
        user_uuid,
    } as WebSocketRegister);

export const GUEST_REGISTER = (room_id: string, user_uuid: string, name: string) =>
    JSON.stringify({
        action: 'guest_register',
        room_id,
        name,
        user_uuid,
    } as WebSocketGuestRegister);

export const SEND_MESSAGE = (message: string, user_uuid: string) =>
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
    } as Message);

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

export const GET_ERROR = (string: string) => {
    const obj = JSON.parse(string);
    if (obj.error) return obj.error;
};

export const SEND_MEDIA_TO_PLAYLIST = ({ url, uuid }: { url: string, uuid: string }) => {
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
    } as SendMediaToPlaylist;

    return JSON.stringify(request);
};

export const DELETE_VIDEO_FROM_PLAYLIST = ({ __id, uuid }: { __id: string, uuid: string }) => {
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
    } as DeleteMediaFromPlaylist;

    return JSON.stringify(request);
};

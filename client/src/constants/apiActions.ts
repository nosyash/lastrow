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

export interface AddEmoteRequest {
    name: string;
    type: 'png' | 'gif';
    base64: string;
    roomId?: string;
}

const getEmoteName = (name: string) =>
    name
        .substr(0, 15)
        .replace(/\.\w+$/, '')
        .replace(/[^a-z0-9_]/gi, '') || 'emote' + Math.round(Math.random() * 10000)

export const ADD_EMOTE = ({ name, type, base64, roomId }: AddEmoteRequest) => {
    const request = {
        action: "room_update",
        body: {
            type: "add_emoji",
            data: {
                name: getEmoteName(name),
                type,
                raw_img: base64.replace(/^data:.+;base64,/, ''),
            }
        },
        room_id: roomId,

    }
    return JSON.stringify(request);
}

export const REMOVE_EMOTE = ({ name, type, roomId }) => {
    const request = {
        action: "room_update",
        body: {
            type: "del_emoji",
            data: {
                name,
                type,
            }
        },
        room_id: roomId,
    }
    return JSON.stringify(request);
}



export const RENAME_EMOTE = ({ name, newname, roomId }) => {
    const request = {
        action: "room_update",
        body: {
            type: "change_emoji_name",
            data: {
                name,
                new_name: newname
            }
        },
        room_id: roomId
    }

    return JSON.stringify(request);
}

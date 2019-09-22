import { Message, MessageEvent } from '../utils/types';

export interface PasswordChange {
    cur_passwd: string;
    new_passwd: string;
}

export interface WebSocketRegister extends Message {
    room_id: string;
    jwt: string;
}

export interface WebSocketGuestRegister extends WebSocketRegister {
    name: string
}

export interface SendMediaToPlaylist extends Message {
    jwt: string,
}

export interface DeleteMediaFromPlaylist extends SendMediaToPlaylist { }

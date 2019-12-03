import { toast } from 'react-toastify';
import http from '../utils/httpServices';
import * as api from '../constants/apiActions';
import * as types from '../constants/actionTypes';
import Axios from 'axios';
import { get } from 'lodash';

import Socket, { SocketInterface } from '../utils/WebSocket';
import { store } from '../store';
import { SOCKET_ENDPOINT } from '../constants';
import { toastOpts } from '../conf';

let socket = null as Socket;

export const webSocketConnect = ({ room_uuid }: { room_uuid: string }) => {
    const { uuid, name, guest } = store.getState().profile;

    webSocketDisconnect();

    socket = new Socket({ url: SOCKET_ENDPOINT, room_uuid, uuid, guest, name } as SocketInterface);
    return socket.state();
};

export const isConnectingSameRoom = (room_uuid: string) => (socket ? room_uuid === socket.room_uuid : false);

export const webSocketSend = (data: string, messageTypeToGet?: string) => {
    return socket.sendMessage(data, messageTypeToGet);
};

export const webSocketDisconnect = () => {
    if (socket) socket.destroy();
};

export const isWebsocketOpened = () => {
    if (socket) {
        return socket.isOpened();
    }
    return false;
}

export const requestColorUpdate = (color: string) => async (dispatch: any) => {
    // const { updateProfile } = this.props;
    const { name } = store.getState().profile;
    const res = await http.post(api.API_USER(), api.UPDATE_USER(name, color));

    if (!res.data) {
        toast.error('There was an error updating your color...', toastOpts);
        return;
    }

    dispatch({ type: types.UPDATE_PROFILE, payload: { ...res.data } });
    return Promise.resolve();
};

export const requestRoom = async () =>  {
    const { roomID } = store.getState().mainStates;
    const { data } = await http.get(api.API_ROOM(roomID), { validateStatus: () => true });

    if (!data) return Promise.resolve();

    const { permissions } = data;

    const emojiList = get(data, 'emoji') || []
    emojiList.sort((a, b) => a.name > b.name ? 1 : -1);

    store.dispatch({ type: types.UPDATE_MAIN_STATES, payload: { uuid: data.uuid } })
    store.dispatch({ type: types.ADD_EMOJIS, payload: emojiList })
    store.dispatch({ type: types.SET_PERMISSIONS, payload: permissions })

    document.title = data.title;

    return Promise.resolve(data);
};

export const requestAddEmote = (params: api.AddEmoteRequest) => async (dispatch: any) => {
    const { uuid } = store.getState().mainStates;
    http.post(api.API_ROOMS(), api.ADD_EMOTE({ ...params, room_uuid: uuid }))
        .then(() => toast.success('Emote successfully upload', toastOpts))
        .then(() => requestRoom())
        .catch(() => toast.error('There was an error loading emote...', toastOpts))
};

export const requestEmoteRename = (params: { name: string; newname: string }) => {
    const { uuid } = store.getState().mainStates;

    http.post(api.API_ROOMS(), api.RENAME_EMOTE({ ...params, room_uuid: uuid }))
        .then(() => requestRoom())
        .then(() => toast.success('Emote successfully renamed', toastOpts))
}

export const requestEmoteDelete = (params: { name: string }) => {
    const { uuid } = store.getState().mainStates;

    http.post(api.API_ROOMS(), api.REMOVE_EMOTE({ ...params, room_uuid: uuid }))
        .then(() => requestRoom())
        .then(() => toast.success('Emote was removed', toastOpts))
}



const roomInstance = Axios.create();
export const requestRoomWithOmitError = async (id: string) => {
    roomInstance.interceptors.response.use(
        (response) => Promise.resolve(response),
        err => Promise.resolve(false)
    );
    const { data } = await roomInstance.get(api.API_ROOM(id));
    return data;
};

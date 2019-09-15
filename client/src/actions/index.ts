import { parse } from 'subtitle';
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

export const fetchSubs = (url: string) => (dispatch: any) => {
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
let socket = null as Socket;

export const webSocketConnect = ({ roomID }: { roomID: any }) => {
    const { uuid, name, guest } = store.getState().profile;

    webSocketDisconnect();

    socket = new Socket({ url: SOCKET_ENDPOINT, roomID, uuid, guest, name } as SocketInterface);
    return socket.state();
};

const isConnectingSameRoom = (roomID: string) => (socket ? roomID === socket.roomID : false);

export const webSocketSend = (data: string, messageTypeToGet?: string, cb?: () => void) => {
    return socket.sendMessage(data, messageTypeToGet, cb);
};

export const webSocketDisconnect = () => {
    if (socket) socket.destroy();
};

export const requestColorUpdate = (color: string) => async (dispatch: any) => {
    // const { updateProfile } = this.props;
    const { name } = store.getState().profile;
    const res = await http.post(api.API_USER(), api.UPDATE_USER(name, color));

    if (!res.data) {
        toast.error('There was an error updating your color...', toastOpts);
        return;
    }
    toast.success('Color successfully changed', toastOpts);

    dispatch({ type: types.UPDATE_PROFILE, payload: { ...res.data } });
    return Promise.resolve();
};

export const requestAddEmote = (params: api.AddEmoteRequest) => async (dispatch: any) => {
    const { ID } = store.getState().mainStates;
    const res = await http.post(api.API_ROOMS(), api.ADD_EMOTE({ ...params, roomId: ID }));

    if (!res.data)
        return toast.error('There was an error loading emote...', toastOpts);
    toast.success('Emote successfully upload', toastOpts);

    return Promise.resolve();
};

export const requestRoom = () => async (dispatch: any) => {
    const { roomID } = store.getState().mainStates;
    const { data } = await http.get(api.API_ROOM(roomID), { validateStatus: () => true });

    if (!data)
        return Promise.resolve(false);
    store.dispatch({ type: types.UPDATE_MAIN_STATES, payload: { ID: data.ID } })
    store.dispatch({ type: types.ADD_EMOJIS, payload: data.emoji || [] })

    document.title = data.title;

    return Promise.resolve(data);
};



const roomInstance = Axios.create();
export const requestRoomWithOmitError = async (id: string) => {
    roomInstance.interceptors.response.use(
        (response) => Promise.resolve(response),
        err => Promise.resolve(false)
    );
    const { data } = await roomInstance.get(api.API_ROOM(id));
    return data;
};

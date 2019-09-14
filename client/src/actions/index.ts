import { parse } from 'subtitle';
import { toast } from 'react-toastify';
import http from '../utils/httpServices';
import * as api from '../constants/apiActions';
import * as types from '../constants/actionTypes';

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

import { get } from 'lodash';
import * as api from '../constants/apiActions';
import * as types from '../constants/actionTypes';
import { store } from '../store';
import { toast } from 'react-toastify';
import { toastOpts } from '../conf';
import {
    UpdateUsers,
    Message,
    ChatMessage,
    TickerData,
    UpdatePlaylistData,
    UpdateUsersData,
    FeedbackData,
    MessageType
} from './types';
import { User } from './types';
import { Store } from 'redux';
import { Emoji } from '../reducers/emojis';
import httpServices from './httpServices';
import { parseAndDispatchSubtitles } from './subtitles';
import { workerRequest } from '../worker/index';

const { dispatch, getState } = store as Store;

export interface SocketInterface {
    instance: WebSocket;
    url: string;
    guest: boolean;
    name: string;
    room_uuid: string;
    uuid: string;
    timer: NodeJS.Timeout;
    reconnectTimer: NodeJS.Timeout;
}

class Socket implements SocketInterface {
    instance: WebSocket;
    url: string;
    guest: boolean;
    name: string;
    room_uuid: string;
    uuid: string;
    timer: NodeJS.Timeout;
    reconnectTimer: NodeJS.Timeout;
    constructor(props: SocketInterface) {
        this.url = props.url;
        this.guest = props.guest;
        this.name = props.name;
        this.room_uuid = props.room_uuid;
        this.uuid = props.uuid;

        this.timer = null;
        this.reconnectTimer = null;
        this.initWebSocket();
    }

    public initWebSocket = () => {
        this.resetStates();
        this.instance = new WebSocket(this.url);
        this.listen();
    };

    public state = () => {
        return new Promise((resolve, reject) => {
            this.timer = setInterval(() => {
                const { readyState } = this.instance;

                if (this.getReadyState(readyState) === 'CLOSED') {
                    dispatch({ type: types.SET_SOCKET_CONNECTED, payload: false });
                    dispatch({ type: types.SET_SOCKET_ERROR, payload: true });
                    clearInterval(this.timer);
                    reject();
                }
                if (this.getReadyState(readyState) === 'OPEN') {
                    clearInterval(this.timer);
                    resolve();
                }
            }, 50);

            setTimeout(() => {
                clearInterval(this.timer);
                reject();
            }, 15000);
        });
    };

    public sendMessage = (dataToSend: string, messageTypeToGet: string, cb: (result: any, error: any) => void) => {
        let timeout: NodeJS.Timeout = null;

        const onMessageLocal = ({ data: receivedData }: any) => {
            const data = JSON.parse(receivedData);
            if (get(data, 'body.event.type') !== messageTypeToGet) return;

            const { message, error } = get(data, 'body.event.data.feedback');

            this.removeEvent('message', onMessageLocal);
            clearTimeout(timeout);

            if (message && message === 'success')
                return cb(true, null);
            else
                return cb(null, error)
        };

        if (messageTypeToGet) {
            this.instance.addEventListener('message', onMessageLocal);
            timeout = setTimeout(() => {
                this.removeEvent('message', onMessageLocal);
                return cb(null, true);
            }, 15000);
        }

        this.instance.send(dataToSend);
    };

    public destroy = () => {
        this.unsubscribeEvents();
        if (this.instance) this.instance.close();
        this.resetStates();
    };

    private removeEvent = (event: string, callback: (...args: any) => void) => {
        this.instance.removeEventListener(event, callback);
    };

    private getReadyState = (readyState: number) => {
        switch (readyState) {
            case 0:
                return 'CONNECTING';
            case 1:
                return 'OPEN';
            case 2:
                return 'CLOSING';
            case 3:
                return 'CLOSED';

            default:
                break;
        }
    };

    private resetStates = () => {
        dispatch({ type: types.SET_SOCKET_CONNECTED, payload: false });
        dispatch({ type: types.SET_SOCKET_ERROR, payload: false });
    };

    private listen = () => {
        this.instance.onopen = () => this.handleOpen();
        this.instance.onmessage = data => this.handleMessage(data);
        this.instance.onerror = () => this.handleError();
        this.instance.onclose = () => this.handleClose();
    };

    private handleOpen = () => {
        console.log('WebSocket conection opened');
        this.handleHandshake();
    };

    private handleHandshake() {
        if (!this.guest) {
            this.instance.send(api.USER_REGISTER(this.room_uuid, this.uuid));
        } else {
            const request = api.GUEST_REGISTER(this.room_uuid, this.uuid, this.name);
            this.instance.send(request);
        }
        dispatch({ type: types.SET_SOCKET_CONNECTED, payload: true });
    }

    private handleMessage = ({ data }: MessageEvent) => {
        const parsedData = JSON.parse(data) as Message;
        // console.log(JSON.stringify(parsedData, null, 4));
        const messageType = get(parsedData, 'body.event.type') as MessageType;

        switch (messageType) {
            case 'update_users': {
                const data = get(parsedData, 'body.event.data') as UpdateUsersData;
                return dispatch({ type: types.UPDATE_USERLIST, payload: moveGuestsToTheEnd(data.users) });
            }
            case 'message': {
                const message = get(parsedData, 'body.event.data') as ChatMessage;
                const payload = { ...message, roomID: this.room_uuid };
                return dispatch({ type: types.ADD_MESSAGE, payload });
            }
            case 'update_playlist': {
                const playlistData = get(parsedData, 'body.event.data') as UpdatePlaylistData;

                const subtitlesUrl = get(playlistData, 'videos[0].subs') as string;
                if (subtitlesUrl) httpServices.get(subtitlesUrl)
                    .then(handleSubtitles)
                    .catch(() => toast.error('Could not fetch subtitles'))

                const dispatchAction = () => dispatch({ type: types.ADD_TO_PLAYLIST, payload: playlistData.videos });
                return this.handleMediaChange(playlistData, dispatchAction);
            }
            case 'ticker': {
                const { ticker } = get(parsedData, 'body.event.data') as TickerData;
                return dispatch({ type: types.UPDATE_MEDIA, payload: { actualTime: ticker.elapsed_time } });
            }
            case 'emoji_update': {
                const emoji = get(parsedData, 'body.event.data.emoji') as Emoji[];
                return dispatch({ type: types.ADD_EMOJIS, payload: emoji || [] });
            }
            case 'error': {
                const error = get(parsedData, 'body.event.data.error') as string;
                return toast.error(error, toastOpts);
            }
            case 'feedback': {
                const { feedback } = get(parsedData, 'body.event.data') as FeedbackData;
                if (feedback.message === 'success')
                    return setAddMediaToSuccess();
                if (feedback.error) {
                    stopAddMediaPending()
                    toast.warn(feedback.error, toastOpts);
                }
            }

            default:
                break;
        }
    };

    private handleMediaChange(data: any, dispatch: (...args: any) => void) {
        const state = getState();
        const mediaBefore = get(state, 'media.playlist[0]');
        const mediaAfter = get(data, 'videos[0]');

        const videoIdCurrent = get(mediaBefore, '__id');
        const videoIdNew = get(mediaAfter, '__id');

        const mediaBeforeChange = new CustomEvent('mediabeforechange', { 'detail': { mediaBefore, mediaAfter } });
        const mediaAfterChange = new CustomEvent('mediaafterchange', { 'detail': { mediaBefore, mediaAfter } });

        const changed = videoIdCurrent !== videoIdNew;
        if (changed) document.dispatchEvent(mediaBeforeChange);
        dispatch();
        // Maybe wait for the next tick?
        if (changed) document.dispatchEvent(mediaAfterChange);
    }

    private handleError = () => {
        this.handleReconnect();
    };

    private handleClose = () => {
        console.log('WebSocket conection closed');
        this.handleReconnect();
    };

    private handleReconnect = () => {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.initWebSocket();
        }, 3000);
    };

    private unsubscribeEvents = () => {
        if (!this.instance) return;
        this.instance.onopen = () => null;
        this.instance.onmessage = () => null;
        this.instance.onerror = () => null;
        this.instance.onclose = () => null;
    };

    // _webSocketReconnect = () => {
    //   clearTimeout(this.timer);

    //   this.timer = setTimeout(() => {
    //     if (!this.pending) this._webSocketReconnect();
    //   }, WEBSOCKET_TIMEOUT);
    // };
}

function subtitlesUpdateEvent() {
    const subtitlesAftersChanged = new CustomEvent('subtitlesafterchange', { 'detail': {} });
    document.dispatchEvent(subtitlesAftersChanged);
}

function handleSubtitles({ data }) {
    // dispatch({ type: types.SET_RAW_SUBS, payload: data })
    dispatch({ type: types.SHOW_SUBS })
    workerRequest.subtitlesInit(data)
    // subtitlesUpdateEvent()
}

function moveGuestsToTheEnd(users: User[]) {
    if (!users) return [];
    const guests = users.filter(user => user.guest);
    const notGuests = users.filter(user => !user.guest);

    return [...notGuests, ...guests]
}

const setAddMediaToSuccess = () => {
    dispatch({ type: types.REMOVE_POPUP, payload: 'addMedia' });
    stopAddMediaPending();
};

const stopAddMediaPending = () => {
    dispatch({ type: types.SET_ADD_MEDIA_PENDING, payload: false });
};

export default Socket;

import { Emoji } from '../reducers/emojis';
import { User } from '../utils/types';

export interface WorkerMessage {
    type: MESSAGE_TYPE;
    kind: MESSAGE_KIND;
    data: any;
}

export enum MESSAGE_TYPE {
    READY = 'ready',
    REQUEST = 'request',
    RESULT = 'result',
    ERROR = 'error'
}

export enum MESSAGE_KIND {
    SUBTITLES_SET_TIME = 'subtitlesSetTime',
    SUBTITLES_INIT = 'subtitlesInit',
    SUBTITLES_READY = 'subtitlesReady',
    SUBTITLES_CURRENT = 'subtitlesCurrent',
    SUBTITLES_DESTROY = 'subtitlesDestroy',
    SUBTITLES_ERROR = 'subtitlesError',
    WEBSOCKET_DATA = 'websocketData',
    WEBSOCKET_MESSAGE = 'websocketMessage',
    MESSAGE_BODY = 'messageBody',
    MESSAGE_BODY_HTML = 'messageBodyHtml',
    GENERIC = 'generic',
}

export interface WebSocketContextData {
    room_uuid?: string;
    emojis?: Emoji[];
    userList?: User[];
    mainUserName?: string;
}

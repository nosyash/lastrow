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
    SUBTITLES_ERROR = 'subtitlesError',
    GENERIC = 'generic',
}

// export interface WorkerSubtitlesInit extends WorkerMessage {
//     data: {
//         subtitles: {
//             raw: string,
//         }
//     }
// }

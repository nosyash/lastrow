interface WorkerMessage {
    type: MESSAGE_TYPE;
    kind: MESSAGE_KIND;
    data: any;
}

enum MESSAGE_TYPE {
    READY = 'ready',
    REQUEST = 'request',
    RESULT = 'result',
    ERROR = 'error'
}

enum MESSAGE_KIND {
    SUBTITLES_SET_TIME = 'subtitlesSetTime',
    SUBTITLES_INIT = 'subtitlesInit',
}
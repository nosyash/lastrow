
const ctx: Worker = self as any;

import { MESSAGE_TYPE, WorkerMessage, MESSAGE_KIND } from './types';
import { initSubs, setSubsTime, subtitlesDestroy } from './SubtitlesHandler';
import { WebSocketMiddleware } from './WebSocketMiddleWare';

ctx.addEventListener('message', (message: any) => {
    const { type, data, kind } = message.data as WorkerMessage;
    if (type !== MESSAGE_TYPE.REQUEST) return;
    switch (kind) {
        case MESSAGE_KIND.SUBTITLES_INIT:
            return initSubs(data.subtitles.raw);

        case MESSAGE_KIND.SUBTITLES_SET_TIME:
            return setSubsTime(data.subtitles.time);

        case MESSAGE_KIND.SUBTITLES_DESTROY:
            return subtitlesDestroy();

        case MESSAGE_KIND.WEBSOCKET_MESSAGE:
            return WebSocketMiddleware({ message: data.message, context: data.context });

        default:
            break;
    }
});


// https://github.com/webpack-contrib/worker-loader/issues/94#issuecomment-449861198
export default {} as typeof Worker & (new () => Worker);

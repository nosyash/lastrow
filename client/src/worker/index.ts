import { dispatch } from '../store';
import * as types from '../constants/actionTypes';
import Worker from './main.worker';
import { WorkerMessage, MESSAGE_TYPE, MESSAGE_KIND } from './types';
const worker = new Worker();


worker.addEventListener('message', (message: any) => {
    const { type, data, kind } = message.data as WorkerMessage;
    if (type === MESSAGE_TYPE.ERROR) console.log(data.message)
    if (type !== MESSAGE_TYPE.RESULT) return;
    switch (kind) {
    case MESSAGE_KIND.SUBTITLES_READY: {
        const subtitlesReady = new CustomEvent('subtitlesready', { 'detail': {} });
        document.dispatchEvent(subtitlesReady);
        break;
    }

    default:
        break;
    }
});

export const workerRequest = {
    subtitlesInit(raw: string) {
        worker.postMessage({
            kind: MESSAGE_KIND.SUBTITLES_INIT,
            type: MESSAGE_TYPE.REQUEST,
            data: {
                subtitles: {
                    raw,
                }
            }
        });
    },
    subtitlesSetTime(time: number) {
        worker.postMessage({
            kind: MESSAGE_KIND.SUBTITLES_SET_TIME,
            type: MESSAGE_TYPE.REQUEST,
            data: {
                subtitles: {
                    time,
                }
            }
        });
    }
}

worker.postMessage('this is a test message to the worker');
export const workerPostMessage = (message: WorkerMessage) => worker.postMessage(message);

const setCurrentSubs = (payload: any) => dispatch({ type: types.SET_CURRENT_SUBS, payload });

import { dispatch } from "../store";
import * as types from "../constants/actionTypes";
import Worker from './main.worker';
const worker = new Worker();


worker.addEventListener('message', (message: WorkerMessage | any) => {
    console.log(message)
    const { type, data } = message;
    switch (type) {
        // case 'SUBTITLES_PARSED':
        //     worker.postMessage('this is a test message to the worker');
        //     break;
    
        default:
            break;
    }
});
worker.postMessage('this is a test message to the worker');
export const workerPostMessage = (message: WorkerMessage) => worker.postMessage(message);

const setCurrentSubs = (payload: any) => dispatch({ type: types.SET_CURRENT_SUBS, payload });
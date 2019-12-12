const ctx: Worker = self as any;
import { MESSAGE_TYPE, MESSAGE_KIND } from './types'
import { SubtitlesItem } from '../reducers/media';
import { Message } from '../utils/types';

export default {
    subtitlesReady() {
        ctx.postMessage({
            type: MESSAGE_TYPE.RESULT,
            kind: MESSAGE_KIND.SUBTITLES_READY,
            data: {
                subtitles: {
                    message: 'Ready'
                }
            }
        })
    },
    subtitlesCurrent(current: SubtitlesItem[]) {
        ctx.postMessage({
            type: MESSAGE_TYPE.RESULT,
            kind: MESSAGE_KIND.SUBTITLES_CURRENT,
            data: {
                subtitles: {
                    current,
                }
            }
        })
    },
    websocketData({ payload, parsedData }: { payload?: any; parsedData?: Message }, messageType: string) {
        ctx.postMessage({
            type: MESSAGE_TYPE.RESULT,
            kind: MESSAGE_KIND.WEBSOCKET_DATA,
            data: {
                payload,
                parsedData,
                messageType,
            }
        })
    },
    error(message: string) {
        ctx.postMessage({
            type: MESSAGE_TYPE.ERROR,
            kind: MESSAGE_KIND.GENERIC,
            data: {
                message,
            }
        })
    }
}

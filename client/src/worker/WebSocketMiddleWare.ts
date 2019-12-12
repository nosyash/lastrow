import { WebSocketContextData } from './types';
import { Message } from '../utils/types';
import { safelyParseJson } from '../utils';
import get from 'lodash-es/get';
import * as messageHandler from './MessageHandler';
import WebWorkerResponser from './WebWorkerResponser';

export function WebSocketMiddleware({ message: data, context }: { message: string; context: WebSocketContextData }) {
    const parsedData: Message = safelyParseJson(data)
    const messageType = get(parsedData, 'body.event.type') as string;

    switch (messageType) {
        case 'message': {
            return messageHandler.onMessage(parsedData, context)
        }

        default: {
            WebWorkerResponser.websocketData({ parsedData }, messageType)
        }
    }
}

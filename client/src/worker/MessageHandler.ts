import { MAX_MESSAGES } from '../constants';
import get from 'lodash-es/get';
import { RoomMessage } from '../reducers/chat';
import MessageContext from './ChatMessageParser';
import { WebSocketContextData } from './types';
import WebWorkerResponser from './WebWorkerResponser';
import { Message } from '../utils/types';

let messageID = 0;
let currentRoomUuid = ''
let chatMessages: RoomMessage[] = [];
let queue = 0

const getLastMessages = (messages: any[]) => messages.slice(Math.max(messages.length - MAX_MESSAGES + 70, 0))

setInterval(() => { console.log(queue) }, 1000)

function watchMessages() {
    const delay = 100;

    setTimeout(() => {
        WebWorkerResponser.websocketData({ payload: chatMessages }, 'message')
        watchMessages()
    }, delay)
}
watchMessages()

export function onMessage(data: Message, context: WebSocketContextData) {
    queue++

    const processMessage = () => {
        const { room_uuid, userList, emojis } = context;

        if (queue > MAX_MESSAGES - 50) {
            queue--
            return
        }
        if (room_uuid !== currentRoomUuid) {
            chatMessages = []
        }
        currentRoomUuid = room_uuid

        const message = get(data, 'body.event.data') as RoomMessage;
        message.id = messageID;
        message.roomID = room_uuid
        messageID++;
        console.time('render')
        message.html = new MessageContext(
            message.color,
            message.image,
            true,
            message.__id,
            message.id,
            true,
            true,
            message.message,
            message.name,
            emojis,
            userList
        ).render()
        console.timeEnd('render')

        chatMessages.push(message)
        if (chatMessages.length > MAX_MESSAGES) chatMessages = getLastMessages(chatMessages)
        queue--
    }

    setTimeout(processMessage, 0);
}

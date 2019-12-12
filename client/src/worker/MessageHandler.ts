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

const getLastMessageId = () => get(chatMessages[chatMessages.length - 1], 'id')
let lastMessageId = getLastMessageId()

function watchMessages() {
    const delay = 200;

    const currentLastMessageId = getLastMessageId()
    if (!currentLastMessageId || currentLastMessageId !== lastMessageId) {
        lastMessageId = currentLastMessageId
        WebWorkerResponser.websocketData({ payload: chatMessages }, 'message')
    }

    setTimeout(watchMessages, delay)
}
watchMessages()

const getPrevMessage = ()  => chatMessages[chatMessages.length - 1] || {} as RoomMessage

export function onMessage(data: Message, context: WebSocketContextData) {
    queue++

    const processMessage = () => {
        const { room_uuid, userList, emojis, mainUserName } = context;

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

        const prevMessage = getPrevMessage()
        const showHeader = message.__id !== prevMessage.__id

        const params = {
            color: message.color,
            avatarUrl: message.image,
            showHeader,
            userId: message.__id,
            messageId: message.id,
            online: true,
            message: message.message,
            name: message.name,
            emojiList: emojis,
            userList: userList,
            mainUserName,
        }
        message.html = new MessageContext(params).render()

        chatMessages.push(message)
        if (chatMessages.length > MAX_MESSAGES) {
            chatMessages = getLastMessages(chatMessages)
        }

        queue--
    }

    setTimeout(processMessage, 0);
}

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

// Initial value should always be different, otherwise first message will not be shown
const getLastMessageId = () => get(chatMessages[chatMessages.length - 1], 'id', -1)
let lastMessageId = getLastMessageId()
let time = Date.now()
let msgPerSecondList = []

let addMessageDelay = 100;
// Map amount of messages per second to delay
function handleAddMessageDelay(msgPerSecond: number) {
    if (msgPerSecond <= 20) addMessageDelay = 100
    if (msgPerSecond > 20 && msgPerSecond <= 60) addMessageDelay = 300
    if (msgPerSecond > 60 && msgPerSecond <= 90) addMessageDelay = 700
    if (msgPerSecond > 90 && msgPerSecond <= 150) addMessageDelay = 900
    if (msgPerSecond > 150 && msgPerSecond <= 200) addMessageDelay = 1300
    if (msgPerSecond > 200 && msgPerSecond <= 500) addMessageDelay = 1800
    if (msgPerSecond > 500) addMessageDelay = 2500
}

function calcAvgMsgPerSecond() {
    const currentMessageId = getLastMessageId()
    const messagesSince = currentMessageId - lastMessageId

    const multi = 1000 / addMessageDelay
    const delay = (messagesSince * multi)
    msgPerSecondList.push(delay)

    const msgPerSecodAvg = Math.round(msgPerSecondList.reduce((acc, curr) => acc + curr, 0) / msgPerSecondList.length)
    if (msgPerSecondList.length > 20) msgPerSecondList = msgPerSecondList.slice(Math.max(msgPerSecondList.length - 20, 0))
    handleAddMessageDelay(msgPerSecodAvg)
    lastMessageId = currentMessageId
}

function watchMessages() {
    const now = Date.now()
    if (now - time > addMessageDelay) {
        const hasNewMessages = lastMessageId !== getLastMessageId()
        calcAvgMsgPerSecond()

        if (hasNewMessages) {
            WebWorkerResponser.websocketData({ payload: chatMessages }, 'message')
        }
        time = now
    }

    setTimeout(watchMessages, 110)
}
watchMessages()

const getPrevMessage = ()  => chatMessages[chatMessages.length - 1] || {} as RoomMessage

export function onMessage(data: Message, context: WebSocketContextData) {
    queue++

    const processMessage = () => {
        if (queue > MAX_MESSAGES - 50) {
            queue--
            return
        }

        const { room_uuid, userList, emojis, mainUserName } = context;

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
            avatar: message.image,
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

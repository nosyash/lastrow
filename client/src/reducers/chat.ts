import { MAX_MESSAGES, MAX_HISTORY } from '../constants';
import * as types from '../constants/actionTypes';
import { User } from '../utils/types';

export interface RoomMessage {
    message: string;
    color: string;
    image: string;
    name: string;
    __id: string;
    roomID: string;
    id: number;
}

export interface Chat {
    roomsMessages: RoomMessage[];
    history: any[];
    users: User[];
    connected: boolean;
    error: boolean;
}

const initialState = {
    roomsMessages: [] as RoomMessage[],
    history: [] as any[],
    users: [] as User[],
    connected: false as boolean,
    error: false as boolean,
};

// list: [{ roomID: 'kek', messages: []}]
// const list = { kek: []}

let id = 0;

// const getRoomMessages = (room: {}) => {
//     if (room && room.list) return room.list;
//     return [];
// };

const Messages = (state = initialState, action: any): any => {
    const historyTemp = Object.assign([], [...state.history, action.payload]);

    switch (action.type) {
        case types.ADD_MESSAGE: {
            id++;
            const message = { ...action.payload };
            const { roomID } = message;

            // delete message.roomID;
            delete message.type;
            message.id = id;

            // const room = state.roomsMessages.find(item => item.roomID === roomID);
            // const currentList = getRoomMessages(room);

            // const roomUpdated = Object.assign({}, { ...room, list: currentList });
            // roomUpdated.roomID = roomID;
            // roomUpdated.list.push(message);
            // const currentRoom = [...(list[roomID] || []), { ...message, id }] || [message];
            const roomsMessages = [...state.roomsMessages, message];
            if (roomsMessages.length > MAX_MESSAGES) roomsMessages.shift();
            // list[roomID] = currentRoom;
            // const roomsMessages = state.roomsMessages;

            // return { ...state, roomsMessages: [...state.roomsMessages, roomUpdated] };
            return { ...state, roomsMessages: roomsMessages as RoomMessage[] };
        }

        case types.CLEAR_MESSAGE_LIST: {
            return { ...state, roomsMessages: [] as RoomMessage[] };
        }

        case types.SET_CURRENT_ROOMID: {
            return { ...state, currentRoomID: action.payload };
        }

        case types.CLEAR_USERS: {
            return { ...state, users: [] as User[] };
        }

        case types.APPEND_TO_HISTORY: {
            const n = historyTemp.length - MAX_HISTORY;
            historyTemp.splice(0, n);
            return { ...state, history: [...historyTemp] };
        }

        case types.UPDATE_USERLIST: {
            const n = historyTemp.length - MAX_HISTORY;
            historyTemp.splice(0, n);
            return { ...state, users: [...action.payload] };
        }

        case types.SET_SOCKET_CONNECTED: {
            return { ...state, connected: action.payload };
        }

        case types.SET_SOCKET_ERROR: {
            return { ...state, error: action.paylaod };
        }

        default:
            return state;
    }
};

export default Messages;

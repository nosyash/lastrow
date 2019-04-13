import { MAX_MESSAGES, MAX_HISTORY } from '../constants';
import * as types from '../constants/ActionTypes';

const initialState = {
  list: {},
  history: [],
  users: [],
  connected: false,
};

// list: [{ roomID: 'kek', messages: []}]
// const list = { kek: []}

let id = 0;

const Messages = (state = initialState, action) => {
  const historyTemp = Object.assign([], [...state.history, action.payload]);

  switch (action.type) {
    case types.ADD_MESSAGE: {
      id++;
      const message = action.payload;
      const { roomID } = message;
      // delete message.roomID;
      delete message.type;

      const list = Object.assign({}, state.list);
      const currentRoom = [...(list[roomID] || []), { ...message, id }] || [
        message,
      ];

      if (currentRoom.length > MAX_MESSAGES) currentRoom.shift();
      list[roomID] = currentRoom;

      return { ...state, list: { ...list } };
    }

    case types.CLEAR_MESSAGE_LIST: {
      return { ...state, list: [] };
    }

    case types.CLEAR_USERS: {
      return { ...state, users: [] };
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

    case types.UPDATE_SOCKET_STATE: {
      return { ...state, connected: action.payload };
    }

    default:
      return state;
  }
};

export default Messages;

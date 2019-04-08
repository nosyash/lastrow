import { MAX_MESSAGES, MAX_HISTORY } from '../constants';
import * as types from '../constants/ActionTypes';

const initialState = {
  list: [],
  history: [],
  users: [],
  connected: false,
};

let id = 0;

const Messages = (state = initialState, action) => {
  const historyTemp = Object.assign([], [...state.history, action.payload]);

  switch (action.type) {
    case types.ADD_MESSAGE: {
      const list = state.list.slice(0);
      if (list.length > MAX_MESSAGES) list.shift();
      id++;
      const message = action.payload;
      delete message.type;
      return { ...state, list: [...list, { ...message, id }] };
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

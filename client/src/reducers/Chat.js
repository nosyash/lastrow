import { MAX_MESSAGES, MAX_HISTORY } from '../constants';
import * as types from '../constants/ActionTypes';

const initialState = {
  list: [],
  history: [],
  users: [],
  connected: false,
};

const Messages = (state = initialState, action) => {
  const historyTemp = Object.assign([], [...state.history, action.payload]);

  switch (action.type) {
    case types.ADD_MESSAGE: {
      const list = state.list.slice(0);

      const n = list.length - MAX_MESSAGES + 1;
      list.splice(0, n);
      return { ...state, list: [...list, action.payload] };
    }

    case types.CLEAR_MESSAGE_LIST: {
      return { ...state, list: [] };
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

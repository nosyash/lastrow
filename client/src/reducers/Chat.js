import { MAX_MESSAGES, MAX_HISTORY } from '../constants';
import * as types from '../constants/ActionTypes';

const initialState = {
  list: [],
  history: [],
  users: [],
};

const Messages = (state = initialState, action) => {
  const historyTemp = Object.assign([], [...state.history, action.payload]);

  switch (action.type) {
    case types.ADD_MESSAGE: {
      const list = state.list.slice(0);

      const n = list.length - MAX_MESSAGES + 1;
      list.splice(0, n);
      return { ...initialState, list: [...list, action.payload] };
    }

    case types.CLEAR_MESSAGE_LIST: {
      return { ...initialState, list: [] };
    }

    case types.APPEND_TO_HISTORY: {
      const n = historyTemp.length - MAX_HISTORY;
      historyTemp.splice(0, n);
      return { ...initialState, history: [...historyTemp] };
    }

    case types.UPDATE_USERLIST: {
      const n = historyTemp.length - MAX_HISTORY;
      historyTemp.splice(0, n);
      return { ...initialState, users: [...action.payload] };
    }

    default:
      return state;
  }
};

export default Messages;

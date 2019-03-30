import { cloneDeep } from 'lodash';
import { MAX_MESSAGES, MAX_HISTORY } from '../constants';
import * as types from '../constants/ActionTypes';

const initialState = {
  list: [],
  history: [],
};

const Messages = (state = initialState, action) => {
  if (action.type === types.ADD_MESSAGE) {
    const list = state.list.slice(0);
    const { history } = state;

    const n = list.length - MAX_MESSAGES + 1;
    list.splice(0, n);
    return { list: [...list, action.payload], history };
  }

  if (action.type === types.CLEAR_MESSAGE_LIST) {
    const { history } = state;
    return { list: [], history };
  }

  if (action.type === types.APPEND_TO_HISTORY) {
    const historyTemp = Object.assign([], [...state.history, action.payload]);
    const { list } = state;

    const n = historyTemp.length - MAX_HISTORY;
    historyTemp.splice(0, n);
    return { list, history: [...historyTemp] };
  }

  return state;
};

export default Messages;

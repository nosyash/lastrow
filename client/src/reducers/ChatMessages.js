import { cloneDeep } from 'lodash';
import { MAX_MESSAGES, MAX_HISTORY } from '../constants';
import { APPEND_TO_HISTORY, ADD_MESSAGE } from '../constants/ActionTypes';

const initialState = {
  list: [],
  history: [],
};

const Messages = (state = initialState, action) => {
  if (action.type === ADD_MESSAGE) {
    const listTemp = cloneDeep(state.list);
    const { history } = state;

    const n = listTemp.length - MAX_MESSAGES + 1;
    listTemp.splice(0, n);
    return { list: [...listTemp, action.payload], history };
  }

  if (action.type === APPEND_TO_HISTORY) {
    const historyTemp = Object.assign([], [...state.history, action.payload]);
    const { list } = state;

    const n = historyTemp.length - MAX_HISTORY;
    historyTemp.splice(0, n);
    return { list, history: [...historyTemp] };
  }

  return state;
};

export default Messages;

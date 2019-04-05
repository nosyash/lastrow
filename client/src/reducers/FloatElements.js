import * as types from '../constants/ActionTypes';

const initialState = {
  list: [],
};

const Components = (state = initialState, action) => {
  switch (action.type) {
    case types.ADD_COMPONENT: {
      const tempList = [...state.list, action.payload];
      const list = tempList.filter(
        (obj, pos, arr) => arr.map(mapObj => mapObj.id).indexOf(obj.id) === pos
      );
      return { list };
    }
    case types.REMOVE_COMPONENT: {
      const filtered = state.list.filter(el => el.id !== action.payload);
      return { list: [...filtered] };
    }
    default:
      return state;
  }
};

export default Components;

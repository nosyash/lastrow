import React from 'react';
import * as types from '../constants/ActionTypes';

const initialState = {
  list: [],
};

const Components = (state = initialState, action) => {
  switch (action.type) {
    case types.ADD_COMPONENT:
      return { list: [...state.list, action.payload] };
    case types.REMOVE_COMPONENT: {
      const filtered = state.list.filter(el => el.id !== action.payload);
      return { list: [...filtered] };
    }
    default:
      return state;
  }
};

export default Components;

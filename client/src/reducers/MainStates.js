import * as types from '../constants/ActionTypes';

const initialState = {
  cinemaMode: false,
  roomID: '',
};

const MainStates = (state = initialState, action) => {
  if (action.type === types.UPDATE_MAIN_STATES) return { ...state, ...action.payload };

  if (action.type === types.TOGGLE_CINEMAMODE) {
    localStorage.cinemaMode = !state.cinemaMode;
    return { ...state, cinemaMode: !state.cinemaMode };
  }

  return state;
};

export default MainStates;

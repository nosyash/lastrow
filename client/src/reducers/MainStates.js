import { UPDATE_MAIN_STATES } from '../constants/ActionTypes';

const initialState = {
  cinemaMode: false,
  roomID: '',
};

const MainStates = (state = initialState, action) => {
  if (action.type === UPDATE_MAIN_STATES) return { ...initialState, ...action.payload };

  return state;
};

export default MainStates;

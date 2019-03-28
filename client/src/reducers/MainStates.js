import { UPDATE_MAIN_STATES } from '../constants/ActionTypes';

const initialState = {
  cinemaMode: false,
};

const MainStates = (state = initialState, action) => {
  if (action.type === UPDATE_MAIN_STATES) return action.payload;

  return state;
};

export default MainStates;

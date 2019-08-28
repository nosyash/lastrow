import * as types from '../constants/ActionTypes';

const initialState = {
  list: [],
  addMedia: false,
  colorPicker: false,
  guestAuth: false,
  imagePicker: false,
  logForm: false,
  newRoom: false,
  playlist: false,
  profileSettings: false,
};

const Popups = (state = initialState, action) => {
  switch (action.type) {
    case types.ADD_POPUP: {
      return { ...state, [action.payload]: true };
    }
    // }

    case types.REMOVE_POPUP: {
      return { ...state, [action.payload]: false };
    }

    case types.TOGGLE_POPUP: {
      return { ...state, [action.payload]: !state[action.payload] };
    }

    case types.CLEAR_POPUPS: {
      return { ...initialState };
    }

    default:
      return state;
  }
};

export default Popups;

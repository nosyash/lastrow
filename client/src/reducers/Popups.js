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
    // case types.ADD_POPUP: {
    //   const tempList = [...state.list, action.payload];
    //   const list = tempList
    //     .filter((obj, index, arr) =>
    //       arr.map(popup => popup.id).indexOf(obj.id) === index);
    //   return { list };
    // }

    case types.REMOVE_POPUP: {
      // const filtered = state.list.filter(el => el.id !== action.payload);
      // return { list: [...filtered] };
      return { ...state, [action.payload]: false };
    }

    case types.TOGGLE_POPUP: {
      // const currentElement = action.payload;
      // let { list } = state;
      // const shouldRemove = list.find(el => currentElement.id === el.id);
      // if (shouldRemove) list = list.filter(el => el.id !== currentElement.id);
      // else list = [...list, currentElement];
      // return { list };
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

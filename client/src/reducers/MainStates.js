import * as types from '../constants/ActionTypes';

const initialState = {
    cinemaMode: false,
    roomID: '',
    chatWidth: parseInt(localStorage.chatWidth) || 300,
};

const mainStates = (state = initialState, action) => {
    if (action.type === types.UPDATE_MAIN_STATES) {
        return { ...state, ...action.payload };
    }

    if (action.type === types.TOGGLE_CINEMAMODE) {
        localStorage.cinemaMode = !state.cinemaMode;
        return { ...state, cinemaMode: !state.cinemaMode };
    }

    if (action.type === types.SET_CHAT_WIDTH) {
        return { ...state, chatWidth: action.payload };
    }

    return state;
};

export default mainStates;

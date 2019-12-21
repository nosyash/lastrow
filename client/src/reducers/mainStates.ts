import * as types from '../constants/actionTypes';
import get from 'lodash-es/get'

export interface MainStates {
    cinemaMode: boolean;
    roomID: string;
    uuid: string;
    chatWidth: number;
}

const initialState: MainStates = {
    cinemaMode: JSON.parse(get(localStorage, 'cinemaMode', false)),
    roomID: '',
    uuid: '',
    chatWidth: JSON.parse(get(localStorage, 'chatWidth', 300)),
};

const mainStates = (state = initialState, action: any) => {
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

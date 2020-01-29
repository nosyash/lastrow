import * as types from '../constants/actionTypes';
import get from 'lodash-es/get'

export interface MainStates {
    cinemaMode: boolean;
    roomID: string;
    uuid: string;
    chatWidth: number;
}

function setCinemaModeClasses(toSet = false) {
    const classList = document.documentElement.classList
    if (toSet) {
        classList.add('cinema-mode')
    } else {
        classList.remove('cinema-mode')
    }
}

const _initialCinemaMode = JSON.parse(get(localStorage, 'cinemaMode', false))
setCinemaModeClasses(_initialCinemaMode)
const initialState: MainStates = {
    cinemaMode: _initialCinemaMode,
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
        setCinemaModeClasses(!state.cinemaMode)
        return { ...state, cinemaMode: !state.cinemaMode };
    }

    if (action.type === types.SET_CHAT_WIDTH) {
        return { ...state, chatWidth: action.payload };
    }

    return state;
};

export default mainStates;

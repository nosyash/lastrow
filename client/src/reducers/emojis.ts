import { ADD_EMOJIS } from '../constants/actionTypes';
import { Reducer } from 'redux'

export interface Emoji {
    name: string;
    path: string;
}

const initialState = {
    list: [] as Emoji[],
};

const Emojis = (state = initialState, action: any): any => {
    if (action.type === ADD_EMOJIS) return { list: action.payload };

    return state;
};

export default Emojis;

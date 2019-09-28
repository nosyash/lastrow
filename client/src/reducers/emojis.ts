import { ADD_EMOJIS, UPDATE_POPULAR_EMOTE } from '../constants/actionTypes';
import ls from 'local-storage';

export interface Emoji {
    name: string;
    path: string;
}

const initialState = {
    list: [] as Emoji[],
    popularEmotes: ls('popularEmotes') as any || [],
};

const Emojis = (state = initialState, action: any): any => {
    if (action.type === ADD_EMOJIS) return { ...state, list: action.payload };
    if (action.type === UPDATE_POPULAR_EMOTE) return { ...state, popularEmotes: action.payload }
    return state;
};

export default Emojis;

import { ADD_EMOJIS } from '../constants/actionTypes';

const initialState = {
    list: [],
};

const Emojis = (state = initialState, action) => {
    if (action.type === ADD_EMOJIS) return { list: action.payload };

    return state;
};

export default Emojis;

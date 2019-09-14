import * as types from '../constants/actionTypes';

const InitialState = {
    list: [],
};

const Rooms = (state = InitialState, action) => {
    if (action.type === types.UPDATE_ROOMLIST) {
        return { list: action.payload };
    }
    return state;
};

export default Rooms;

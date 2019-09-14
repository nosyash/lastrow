import * as types from '../constants/actionTypes';
import { Room } from '../utils/types';

const InitialState = {
    list: [] as Room[],
};

const Rooms = (state = InitialState, action: any) => {
    if (action.type === types.UPDATE_ROOMLIST) {
        return { list: action.payload };
    }
    return state;
};

export default Rooms;

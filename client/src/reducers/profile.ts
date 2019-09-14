import * as types from '../constants/actionTypes';
import { User } from '../utils/types';

export interface Profile extends User {
    logged: boolean;
    guest: boolean;
    name: string;
    username: string;
    color: string;
    online: boolean;
    uuid: string;
    id: number;
    image: string;
}

const profile = {
    logged: undefined as any,
    guest: false,
    name: '',
    username: '',
    color: '#dddddd',
    online: true,
    uuid: '',
    id: 0,
    image: '',
};

const Profile = (state = profile, action: any) => {
    if (action.type === types.UPDATE_PROFILE) {
        return { ...state, ...action.payload };
    }

    return state;
};

export default Profile;

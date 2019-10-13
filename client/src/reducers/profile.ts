/* eslint-disable @typescript-eslint/camelcase */
import * as types from '../constants/actionTypes';
import { User as UserInterface } from '../utils/types';
import { PermissionsMap } from './rooms';

export interface Role {
    Level: PermissionsMap;
    room_uuid: string;
}

export interface Profile extends UserInterface {
    logged: boolean;
    guest: boolean;
    name: string;
    username: string;
    color: string;
    online: boolean;
    uuid: string;
    id: number;
    image: string;
    roles: Role[];
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
    roles: [],
} as Profile;

const Profile = (state = profile, action: any) => {
    if (action.type === types.UPDATE_PROFILE) {
        return { ...state, ...action.payload };
    }

    return state;
};

export default Profile;

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
    currentLevel: PermissionsMap;
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
    currentLevel: 0,
} as Profile;

const Profile = (state = profile, action: any) => {
    switch (action.type) {
        case types.UPDATE_PROFILE:
            return { ...state, ...action.payload };

        case types.SET_ROLES:
            return { ...state, roles: action.payload }

        case types.SET_CURRENT_LEVEL:
            return { ...state, currentLevel: action.payload }
    
        default: return state
    }
};

export default Profile;

import * as api from '../constants/apiActions';
import { Profile } from '../reducers/profile';
import http from './httpServices';
import { Room } from './types';

export const getProfile = async () => {
    return http.silentGet(api.API_USER())
        .then(res => res.data as Profile)
};

export const getRoom = async (roomId: string) => {
    return http.silentGet(api.API_ROOM(roomId))
        .then(res => res.data as Room)
};


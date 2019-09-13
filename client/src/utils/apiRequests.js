import Axios from 'axios';
import * as api from '../constants/apiActions';

const instance = Axios.create();
const roomInstance = Axios.create();

export const getProfile = async () => {
    instance.interceptors.response.use(null, error => null);
    const res = await instance.get(api.API_USER());
    return res;
};

export const roomExist = async id => {
    roomInstance.interceptors.response.use(
        () => Promise.resolve(true),
        err => Promise.resolve(false)
    );
    const res = await roomInstance.get(api.API_ROOM(id));
    return res;
};

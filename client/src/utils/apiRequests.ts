import Axios from 'axios';
import * as api from '../constants/apiActions';

const instance = Axios.create();

export const getProfile = async () => {
    instance.interceptors.response.use(null, error => null);
    const res = await instance.get(api.API_USER());
    return res;
};


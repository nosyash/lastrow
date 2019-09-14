import axios from 'axios';
import { toast } from 'react-toastify';
import { toastOpts } from '../conf';

axios.defaults.withCredentials = false;

axios.interceptors.response.use(res => handleResponse(res), error => handleError(error));

const handleResponse = res => {
    const { data } = res;
    const { error } = data;
    if (error) toast.error(error, toastOpts);
    if (error) return Promise.resolve(error);
    return Promise.resolve(res);
};

const handleError = error => {
    if (!error.response) return;
    const { data } = error.response;
    if (!toast.isActive(error.response.status)) {
        if (data && data.error) {
            toast.error(data.error, { toastId: error.response.status, ...toastOpts });
        } else {
            toast.error(`Error ${error.response.status} occured`, {
                toastId: error.response.status,
                ...toastOpts,
            });
        }
    }
    return Promise.reject(error);
};

function setToken(token) {
    axios.defaults.headers.common['x-auth-token'] = token;
}

export default {
    get: axios.get,
    post: axios.post,
    put: axios.put,
    delete: axios.delete,
};

export { setToken };

import axios, { AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { toastOpts } from '../conf';

axios.defaults.withCredentials = false;
axios.interceptors.response.use(res => handleResponse(res), error => handleError(error));

function handleResponse(res: AxiosResponse<any>) {
    const { data } = res;
    const { error } = data;
    if (error) toast.error(error, toastOpts);
    if (error) return Promise.resolve(error);
    return Promise.resolve(res);
}

function handleError(error: any) {
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
}

// axios instance without interceptors
const silentAxios = axios.create();

export default {
    get: axios.get,
    post: axios.post,
    put: axios.put,
    delete: axios.delete,

    silentGet: silentAxios.get,
    silentPost: silentAxios.post,
    silentPut: silentAxios.put,
    silentDelete: silentAxios.delete,
};

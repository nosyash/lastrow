import axios, { AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { toastOpts } from '../conf';

axios.defaults.withCredentials = false;
axios.interceptors.response.use(res => handleResponse(res), error => handleError(error));

function handleResponse(res: AxiosResponse<any>) {
    const { error } = res.data;
    if (error) {
        toast.error(error, toastOpts);
    }
    return res
}

function handleError(error: any) {
    if (!error.response) {
        return error;
    }

    const { data, status } = error.response;

    if (!toast.isActive(status)) {
        if (data && data.error) {
            toast.error(data.error, { toastId: status, ...toastOpts });
        } else {
            toast.error(`Error ${status} occured`, {
                toastId: status,
                ...toastOpts,
            });
        }
    }
    return error
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

import axios from 'axios';
import { toast } from 'react-toastify';
import { toastOpts } from '../constants';

axios.interceptors.response.use(null, error => {
  if (!error.response) return;
  if (!toast.isActive(error.response.status)) {
    toast.error(`Error ${error.response.status} occured`, {
      toastId: error.response.status,
      ...toastOpts,
    });
  }
  return Promise.reject(error);
});

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

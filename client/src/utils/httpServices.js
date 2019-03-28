import axios from 'axios';
// import { toast } from 'react-toastify';
// axios.defaults.baseURL = process.env.REACT_APP_API_URL;

// export const testApi = "http://jsonplaceholder.typicode.com/posts/13";

axios.interceptors.response.use(null, error => {
  const expectedError =
    error.response && error.response.status >= 400 && error.response.status < 500;
  console.log(error);
  if (!expectedError) {
    console.log(error);
    // toast.error('Unexpected error occured');
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

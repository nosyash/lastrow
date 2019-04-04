import Axios from 'axios';
import http from './httpServices';
import { API_ENDPOINT } from '../constants';

const instance = Axios.create();

export const getProfile = async () => {
  instance.interceptors.response.use(null, error => null);
  const res = await instance.get(`${API_ENDPOINT}/user`);
  return res;
};

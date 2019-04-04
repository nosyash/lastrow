import Axios from 'axios';
import http from './httpServices';
import { API_ENDPOINT } from '../constants';

const instance = Axios.create();
const roomInstance = Axios.create();

export const getProfile = async () => {
  instance.interceptors.response.use(null, error => null);
  const res = await instance.get(`${API_ENDPOINT}/user`);
  return res;
};

export const roomExist = async id => {
  roomInstance.interceptors.response.use(
    r => Promise.resolve(true),
    err => Promise.resolve(false)
  );
  const res = await roomInstance.get(`${API_ENDPOINT}/r/${id}`);
  return res;
};

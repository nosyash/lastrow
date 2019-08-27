import axios from 'axios';
import { parse } from 'subtitle';
import { FETCH_SUBS, SET_SUBS } from '../constants/ActionTypes';
import http from '../utils/httpServices';

export const fetchSubs = url => dispatch =>
  http
    .get(url)
    .then(response => {
      console.log(dispatch);
      dispatch({ type: SET_SUBS, payload: { srt: parse(response.data) } });
    })
    .catch(error => {
      throw error;
    });

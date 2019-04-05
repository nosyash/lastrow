import * as types from '../constants/ActionTypes';

const profile = {
  logged: undefined,
  name: 'test',
  color: 'rgb(218, 63, 110)',
  online: true,
  uuid: '',
  id: 0,
  iamge: '',
};

const Profile = (state = profile, action) => {
  if (action.type === types.UPDATE_PROFILE) return { ...state, ...action.payload };

  return state;
};

export default Profile;

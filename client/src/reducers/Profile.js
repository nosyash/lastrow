import { UPDATE_PROFILE } from '../constants/ActionTypes';

const profile = {
  name: 'test',
  color: 'rgb(218, 63, 110)',
  online: true,
  id: 0,
  avatar: null,
};

const Profile = (state = profile, action) => {
  if (action.type === UPDATE_PROFILE) return action.payload;

  return state;
};

export default Profile;

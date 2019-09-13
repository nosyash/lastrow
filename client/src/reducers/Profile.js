import * as types from '../constants/ActionTypes';

const profile = {
    logged: undefined,
    guest: false,
    name: '',
    username: '',
    color: '#dddddd',
    online: true,
    uuid: '',
    id: 0,
    image: '',
};

const Profile = (state = profile, action) => {
    if (action.type === types.UPDATE_PROFILE) {
        return { ...state, ...action.payload };
    }

    return state;
};

export default Profile;

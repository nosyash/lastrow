import { combineReducers } from 'redux';
import mainStates from './mainStates';
import chat from './chat';
import emojis from './emojis';
import profile from './profile';
import media from './media';
import rooms from './rooms';
import popups from './popups';

export default combineReducers({
    mainStates,
    chat,
    emojis,
    popups,
    profile,
    media,
    rooms,
});

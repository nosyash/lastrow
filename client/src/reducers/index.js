import { combineReducers } from 'redux';
import mainStates from './MainStates';
import chat from './Chat';
import emojis from './Emojis';
import profile from './Profile';
import media from './Media';
import rooms from './Rooms';
import popups from './Popups';

export default combineReducers({
    mainStates,
    chat,
    emojis,
    popups,
    profile,
    media,
    rooms,
});

import { combineReducers } from 'redux';
import mainStates, { MainStates } from './mainStates';
import chat, { Chat } from './chat';
import emojis, { Emojis } from './emojis';
import profile, { Profile } from './profile';
import media, { Media } from './media';
import rooms, { Rooms } from './rooms';
import popups from './popups';

export interface State {
    mainStates: MainStates;
    chat: Chat;
    emojis: Emojis;
    popups: any;
    profile: Profile;
    media: Media;
    rooms: Rooms;
}

export default combineReducers({
    mainStates,
    chat,
    emojis,
    popups,
    profile,
    media,
    rooms,
});

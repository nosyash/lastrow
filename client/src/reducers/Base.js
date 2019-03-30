import { combineReducers } from 'redux';
import MainStates from './MainStates';
import Chat from './Chat';
import emojis from './Emojis';
import profile from './Profile';
import Media from './Media';
import Rooms from './Rooms';

export default combineReducers({ MainStates, Chat, emojis, profile, Media, Rooms });

import { combineReducers } from 'redux';
import MainStates from './MainStates';
import messages from './Chat';
import emojis from './Emojis';
import profile from './Profile';
import player from './Player';

export default combineReducers({ MainStates, messages, emojis, profile, player });
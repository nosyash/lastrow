import { combineReducers } from 'redux';
import MainStates from './MainStates';
import Chat from './Chat';
import emojis from './Emojis';
import profile from './Profile';
import Media from './Media';
import Rooms from './Rooms';
import Components from './Components';

export default combineReducers({
  MainStates,
  Chat,
  emojis,
  Components,
  profile,
  Media,
  Rooms,
});

import { UPDATE_PLAYER } from '../constants/ActionTypes';

const InitialState = {
  url: 'https://stream.bona.cafe/uzzu/ep20.mp4',
  // url: '',
  // url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
  duration: 0,
  currentTime: 0,
  paused: true,
  playbackRate: 0,
  height: 0,
  width: 0,
  volume: 1,
  kind: {
    hls: false,
    directFile: false,
  },
};

const Player = (state = InitialState, action) => {
  if (action.type === UPDATE_PLAYER) return action.payload;

  return state;
};

export default Player;

import * as types from '../constants/ActionTypes';

const InitialState = {
  url: 'https://stream.bona.cafe/uzzu/ep20.mp4',
  duration: 0,
  currentTime: 0,
  playing: false,
  playbackRate: 0,
  height: 0,
  width: 0,
  volume: 1,
  kind: {
    hls: false,
    directFile: false,
  },
  playlist: [],
};

const Player = (state = InitialState, action) => {
  switch (action.type) {
    case types.UPDATE_MEDIA: {
      return { ...state, ...action.payload };
    }

    case types.UPDATE_MEDIA_URL: {
      const url = action.payload;
      return { ...state, url };
    }

    default: {
      return state;
    }
  }
};

export default Player;

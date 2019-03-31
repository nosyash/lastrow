import * as types from '../constants/ActionTypes';

const InitialState = {
  url: 'https://up.bona.cafe/src/38/b6d94984ce80c60357f7a1d8cf346b56873a56.webm',
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

    case types.SWITCH_PLAY: {
      const url = action.payload;
      return { ...state, playing: !state.playing };
    }

    default: {
      return state;
    }
  }
};

export default Player;

import * as types from '../constants/ActionTypes';

const InitialState = {
  url: 'https://stream.bona.cafe/uzzu/ep35.mp4',
  playlist: [],
  duration: 0,
  currentTime: 0,
  playing: false,
  playbackRate: 0,
  height: 0,
  width: 0,
  volume: 1,
  muted: false,
  kind: {
    hls: false,
    directFile: false,
  },
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
      return { ...state, playing: !state.playing };
    }

    case types.SWITCH_MUTE: {
      return { ...state, muted: !state.muted };
    }

    default:
      return state;
  }
};

export default Player;

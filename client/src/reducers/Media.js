import * as types from '../constants/ActionTypes';

const InitialState = {
  url: '',
  subs: {
    url: 'https://stream.bona.cafe/uzzu/ep15.srt',
    text: [],
    srt: '',
    start: 0,
    end: 0,
  },
  showSubs: false,
  playlist: [
    {
      title:
        '[V LIVE] [UZZU TAPE (우쭈테잎)] EP. 16 경복궁 야간기행, 시간의 다리를 건너다!123123213',
      duration: 2359,
      url: 'https://stream.bona.cafe/uzzu/ep15.mp4',
      index: 0,
      direct: true,
      __id: '00558ab4060d4a8391c2f38757930ef6f9ae8f7dc030e3a28d5e052d7703dc82',
    },
  ],
  duration: 0,
  currentTime: 0,
  actualTime: 0,
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

    case types.ADD_TO_PLAYLIST: {
      return { ...state, playlist: action.payload };
    }

    case types.SET_PLAY:
      return { ...state, playing: true };

    case types.SET_PAUSE:
      return { ...state, playing: false };

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

    case types.SET_VOLUME: {
      localStorage.volume = action.payload;
      return { ...state, volume: action.payload };
    }

    case types.SET_SUBS: {
      return { ...state, subs: { ...state.subs, ...action.payload } };
    }

    case types.SET_CURRENT_SUBS: {
      const { subs } = state;
      subs.text = action.payload;
      return { ...state, subs };
    }

    case types.RESET_MEDIA: {
      return { ...InitialState };
    }

    default:
      return state;
  }
};

export default Player;

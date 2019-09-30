import * as types from '../constants/actionTypes';
import { Video } from '../utils/types';
import { string } from 'joi';

export interface SubtitlesItem {
    start: number;
    end: number;
    text: string;
}

export interface Subtitles {
    url?: string;
    parsed: SubtitlesItem[];
    currentSubtitles: SubtitlesItem[];
    raw: string;
}

export interface Media {
    addMediaPending: boolean;
    actualTime: number;
    currentTime: number;
    duration: number;
    width: number;
    forceSync: boolean;
    height: number;
    muted: boolean;
    playbackRate: number;
    playing: boolean;
    playlist: Video[],
    showSubs: boolean;
    subs: Subtitles,
    url: string,
    volume: number,
}

const InitialState = {
    addMediaPending: false,
    actualTime: 0,
    currentTime: 0,
    duration: 0,
    width: 0,
    forceSync: true,
    height: 0,
    muted: false,
    playbackRate: 0,
    playing: true,
    playlist: [],
    showSubs: false,
    subs: {
        url: '',
        parsed: [],
        currentSubtitles: [],
        raw: '',
    } as Subtitles,
    url: '',
    volume: 50,
} as Media;

const Player = (state = InitialState, action: any): Media => {
    switch (action.type) {
        case types.UPDATE_MEDIA:
            return { ...state, ...action.payload };

        case types.ADD_TO_PLAYLIST:
            return { ...state, playlist: action.payload };

        case types.TOGGLE_SYNC:
            return { ...state, forceSync: !state.forceSync };

        case types.SET_ADD_MEDIA_PENDING:
            return { ...state, addMediaPending: action.payload };

        case types.SET_PLAY:
            return { ...state, playing: true };

        case types.SET_PAUSE:
            return { ...state, playing: false };

        case types.UPDATE_MEDIA_URL: {
            const url = action.payload;
            return { ...state, url };
        }

        case types.SWITCH_PLAY:
            return { ...state, playing: !state.playing };

        case types.SWITCH_MUTE:
            return { ...state, muted: !state.muted };

        case types.SET_VOLUME: {
            localStorage.volume = action.payload;
            return { ...state, volume: action.payload };
        }

        case types.SET_SUBS:
            return { ...state, subs: { ...state.subs, ...action.payload } };

        case types.SET_CURRENT_SUBS: 
            return { ...state, subs: { ...state.subs, currentSubtitles: action.payload } };

        case types.SET_SUBS_URL: 
            return { ...state, subs: { ...state.subs, url: action.payload } };

        case types.SHOW_SUBS: 
            return { ...state, showSubs: true };

        case types.HIDE_SUBS: 
            return { ...state, showSubs: false };

        case types.TOGGLE_SUBS: 
            return { ...state, showSubs: !state.showSubs };

        case types.RESET_MEDIA: 
            return { ...InitialState };

        default:
            return state;
    }
};

export default Player;

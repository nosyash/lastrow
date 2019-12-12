// Selectors
export const CHAT_NAME_SEL = '.chat-name';
export const CHAT_HEADER_SEL = '.chat-header';
export const USER_ICON_SEL = '.user-icon';
export const CHAT_INNER_SEL = '.chat-inner';
export const CHAT_CONTAINER_SEL = '.chat-container';
export const RESIZER_SEL = '.resizer';
export const DIVIDER_SEL = '.custom-divider';
export const SEEK_SEL = '.seek-trigger';
export const VOLUME_SEL = '.volume_trigger';
export const VIDEO_ELEMENT_SEL = '.video-element';
export const POPUP_HEADER = '.popup-header';
export const POPUP_RESIZE_HANDLER = '.popup__resize-handle';

// Misc
export const RESIZE_OFFSET = 10;
export const MAX_MESSAGES = 180;
export const MAX_HISTORY = 20;
export const MAX_MESSAGE_LENGTH = 400;
export const WEBSOCKET_TIMEOUT = 2000;
export const API_FETCH_TIMEOUT = 2000;
export const PLAYER_MINIMIZE_TIMEOUT = 2000;
export const VOLUME_WHEEL = 0.1;
export const MIN_CHAT_WIDTH = 140;
export const MAX_CHAT_WIDTH = 700;
export const MAXIMUM_RECENT_EMOTES = 7;

export const MAXIMUM_SUBTITLES_SIZE = 15;

export const MAX_VIDEO_SYNC_OFFSET = 6; // sec
// export const PIXELS_TO_DISABLE_AUTOSCROLL = 40;

// API
const getWindow = () => {
    try {
        return window
    } catch (error) {
        return null
    }
}
const origin = getWindow() ? getWindow().location.origin : '';
const https = getWindow() ? getWindow().location.protocol === 'https:' : '';
const hostname = getWindow() ? getWindow().location.host : '';
export const API_ENDPOINT = `${origin}/api`;
export const SOCKET_ENDPOINT = `${https ? 'wss' : 'ws'}:${hostname}/api/ws`;

// RegExp
export const PARAGRAPH = new RegExp(/^(.*)$/gim);
export const LINK = new RegExp(/(https?:\/\/[^\s<>]+)/gim);
export const ME = new RegExp(/<p>\/me\s(.+)<\/p>$/gim);
export const DO = new RegExp(/<p>\/do\s(.+)<\/p>$/gim);
export const QUOTE = new RegExp(/<p>(>.+?)<\/p>/gim);
export const TODO = new RegExp(/\/todo\s(.*)\s\*\s(.*)$/gim);
export const ITALIC = new RegExp(/(\*)(.+?)(\*)/gi);
export const CENSORED = new RegExp(/(--)(.+?)(--)/gi);
export const BOLD = new RegExp(/(\*\*)(.+?)(\*\*)/gi);
export const SPOILER = new RegExp(/(%%)(.+?)(%%)/gi);
export const PREFORMATTED = new RegExp(/(^```)((.|\n)+)(```$)/, 'gim');
export const EMOTE = new RegExp(/(:)([a-zA-Z0-9_]+)(:)(?!.*<\/a)/gim);

// WebSocket ReadyStates
export const CONNECTING = 0;
export const OPEN = 1;
export const CLOSING = 2;
export const CLOSED = 3;

export const isEdge = getWindow() ? getWindow().navigator.userAgent.indexOf('Edge') > -1 : false;

// popups
export const COLOR_PICKER = 'colorPicker';
export const GUEST_AUTH = 'guestAuth';
export const IMAGE_PICKER = 'imagePicker';
export const LOG_FORM = 'logForm';
export const NEW_ROOM = 'newRoom';
export const PLAYLIST = 'playlist';
export const PROFILE_SETTINGS = 'profileSettings';
export const SETTINGS = 'settings';
export const CHAT_FLOAT = 'chatFloat';

// control panel
export const CONTROL_PANEL_EXPAND_DELAY = 150 // ms
export const CONTROL_PANEL_COLLAPSE_DELAY = 300 // ms

export const DEBUG = process.env.NODE_ENV !== 'production'
export const DEBUG_GRANT_ALL_PERMISSIONS = false

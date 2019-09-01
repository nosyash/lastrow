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

// Misc
export const RESIZE_OFFSET = 10;
export const MAX_MESSAGES = 100;
export const MAX_HISTORY = 20;
export const MAX_MESSAGE_LENGTH = 400;
export const WEBSOCKET_TIMEOUT = 2000;
export const API_FETCH_TIMEOUT = 2000;
export const PLAYER_MINIMIZE_TIMEOUT = 2000;
export const VOLUME_WHEEL = 0.1;
export const MIN_CHAT_WIDTH = 140;
export const MAX_CHAT_WIDTH = 700;

// API
const origin = window.location.origin;
const https = window.location.protocol === 'https:';
const hostname = window.location.host;
export const API_ENDPOINT = `${origin}/api`;
export const SOCKET_ENDPOINT = `${https ? 'wss' : 'ws'}:${hostname}/api/ws`;

// RegExp
export const PARAGRAPH = new RegExp(/^(.*)$/gim);
export const LINK = new RegExp(/(https?:\/\/[^\s<>]+[a-z])/gim);
export const ME = new RegExp(/<p>\/me\s(.+)<\/p>$/gim);
export const DO = new RegExp(/<p>\/do\s(.+)<\/p>$/gim);
export const QUOTE = new RegExp(/<p>(>.+?)<\/p>/gim);
export const TODO = new RegExp(/\/todo\s(.*)\s\*\s(.*)$/gim);
export const ITALIC = new RegExp(/(\*)(.+?)(\*)/gi);
export const CENSORED = new RegExp(/(--)(.+?)(--)/gi);
export const BOLD = new RegExp(/(\*\*)(.+?)(\*\*)/gi);
export const SPOILER = new RegExp(/(%%)(.+?)(%%)/gi);
export const PREFORMATTED = new RegExp(/(^```)((.|\n)+)(```$)/, 'gim');
export const EMOTE = new RegExp(/([> ])(:)([a-zA-Z0-9_]+)(:)([ <])/g);

// WebSocket ReadyStates
export const CONNECTING = 0;
export const OPEN = 1;
export const CLOSING = 2;
export const CLOSED = 3;

export const toastOpts = {
  autoClose: 4000,
  hideProgressBar: true,
  pauseOnFocusLoss: false,
  newestOnTop: true,
};

export const isEdge = window.navigator.userAgent.indexOf('Edge') > -1;

export const playerConf = {
  youtube: {
    playerVars: { autoplay: 1, controls: 1 },
    preload: true,
  },
};

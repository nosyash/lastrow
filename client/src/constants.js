/* eslint-disable prefer-template */
const { REACT_APP_API_ENDPOINT } = process.env;

// Selectors
export const CHAT_NAME_SEL = '.chat-name';
export const CHAT_HEADER_SEL = '.chat-header';
export const USER_ICON_SEL = '.user-icon';
export const CHAT_INNER_SEL = '.chat-inner';
export const CHAT_CONTAINER_SEL = '.chat-container';
export const RESIZER_SEL = '.resizer';
export const DIVIDER_SEL = '.custom-divider';
export const SEEK_SEL = '.seek_trigger';
export const VOLUME_SEL = '.volume_trigger';

// Misc
export const RESIZE_OFFSET = 10;
export const MAX_MESSAGES = 100;
export const MAX_HISTORY = 20;
export const MAX_MESSAGE_LENGTH = 400;
export const WEBSOCKET_TIMEOUT = 2000;
export const API_FETCH_TIMEOUT = 2000;

// API
const https = window.location.protocol === 'https:';
export const API_ENDPOINT = `//${REACT_APP_API_ENDPOINT}/api`;
export const SOCKET_ENDPOINT = (https ? 'wss' : 'ws') + `:${API_ENDPOINT}/ws`;

// RegExp
export const PARAGRAPH = new RegExp(/^((.*)?)$/gim);
export const ME = new RegExp(/\/me\s(.*)$/gim);
export const DO = new RegExp(/\/do\s(.*)$/gim);
export const TODO = new RegExp(/\/todo\s(.*)\s\*\s(.*)$/gim);
export const ITALIC = new RegExp(/(\*)(.{1,}?)(\*)/gi);
export const BOLD = new RegExp(/(\*\*)(.{1,}?)(\*\*)/gi);
export const SPOILER = new RegExp(/(%%)(.{1,}?)(%%)/gi);
export const PREFORMATTED = new RegExp(/(^```)((.|\n){1,})(```$)/, 'gim');
export const EMOTE = new RegExp(/(:)(\S{1,31})(:)/, 'gim');

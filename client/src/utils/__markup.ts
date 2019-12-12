// import { store } from '../store';

import createDOMPurify from 'dompurify';
import showdown from 'showdown/dist/showdown.min.js';
import { JSDOM } from 'jsdom'

const { window } = new JSDOM('<!DOCTYPE html>')
const DOMPurify = createDOMPurify(window)
import { User } from './types';
import { Emoji } from '../reducers/emojis';

// showdown.setOption('simplifiedAutoLink', true)
// showdown.setOption('excludeTrailingPunctuationFromURLs', true)
showdown.setOption('literalMidWordUnderscores', true)
showdown.setOption('encodeEmails', false)
showdown.setOption('omitExtraWLInCodeBlocks', true)
showdown.setOption('simpleLineBreaks', false)

let postAuthorName = '';
let emojis: Emoji[] = []
let userList: User[] = []

const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;', '#': '\\#', '- ': '\\- ' };
// const unescapeMap = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", };

showdown.extension('escapeMap', () => [{ type: 'lang', regex: /([&<>"'#]|(-\s))/g, replace: (s, match) => escapeMap[match] }]);

showdown.extension('spoiler', () => [{ type: 'lang', regex: /%%(.+?)%%/gs, replace: `<del class="markup--spoiler">$1</del>` }]);
showdown.extension('bold', () => [{ type: 'lang', regex: /\*\*(.+)\*\*/gs, replace: `<strong class="markup--bold">$1</strong>` }]);
showdown.extension('italic', () => [{ type: 'lang', regex: /\*(.+)\*/gs, replace: `<em class="markup--italic">$1</em>` }]);
showdown.extension('link', () => [{
    type: 'lang', regex: /(http(s)?:\/\/([^\s])+[^.;\s,:])/gi,
    replace: `<a href="$1" "class="markup--link" target="_blank">$1</a>`
}]);

showdown.extension('me', () => [{ type: 'lang', regex: /^\/me (.+)/s, replace: meReplace }]);
showdown.extension('do', () => [{ type: 'lang', regex: /^\/do (.+)/s, replace: doReplace }]);
showdown.extension('emotes', () => [{ type: 'lang', regex: /:([a-zA-Z_0-9]{1,32}):/g, replace: emoteReplace }]);
showdown.extension('quote', () => [{ type: 'lang', regex: /^(&gt;.+?)$/gim, replace: `<em class="markup--quote">$1</em>` }]);

showdown.extension('trailingSpaces', () => [{ type: 'lang', regex: /^\s+/gm, replace: '' }]);
showdown.extension('linebreak', () => [{ type: 'lang', regex: /\n/g, replace: '<br>' }]);
showdown.extension('multiLineBreak', () => [{ type: 'lang', regex: /\n{3,}/g, replace: '\n\n' }]);
showdown.extension('trailingLineBreak', () => [{ type: 'lang', regex: /^\n*/s, replace: '' }])

function emoteReplace(string: string, match: string) {
    const emote = emojis.find(e => e.name === match)
    if (emote) {
        return `<img class="emote" src="${emote.path}" title=":${emote.name}:">`
    } else {
        return string;
    }
}
function meReplace(_: string, match: string) {
    return `<em class="markup--me">${postAuthorName} ${match}</em>`
}
function doReplace(_: string, match: string) {
    const output = match.replace(/\n/g, ' ')
    return `<em class="markup--do">${output}</em>`
}


const converter = new showdown.Converter({
    extensions: [
        'trailingLineBreak',
        'multiLineBreak',
        'escapeMap',
        'spoiler',
        'me',
        'do',
        'bold',
        'italic',
        'quote',
        'link',
        'emotes',
    ]
});

const cacheInit = () => {
    const _cache = {}
    const cacheMarkup = (key: string, value: string) => { _cache[key] = value }
    const getCachedMarkup = (key: string) => _cache[key]
    return {
        cacheMarkup,
        getCachedMarkup,
    }
}
const cacheInstance = cacheInit()

function parseBody(input: string, params = {} as { postAuthorName: string; emojis: Emoji[]; userList: User[] }): string {
    const cachedBody = cacheInstance.getCachedMarkup(input)
    if (cachedBody) {
        return cachedBody
    }

    postAuthorName = params.postAuthorName;
    emojis = params.emojis;
    userList = params.userList;
    // console.time('makeHTML')
    const parsed = converter.makeHtml(input)
    // console.timeEnd('makeHTML')
    const parsedWithReplies = getReplies(parsed)
    // console.time('sanitize')
    const output = DOMPurify.sanitize(parsedWithReplies, { ADD_ATTR: ['target'], ALLOWED_TAGS: ['a', 'em', 'strong', 'del', 'br', 'img'] });
    // console.timeEnd('sanitize')
    cacheInstance.cacheMarkup(input, output)
    return output
}

function getReplies(string: string) {
    // const userList: User[] = store.getState().chat.users;
    if (userList.length === 0) {
        return string;
    }

    const userListToName =
        userList.map(user => escapeRegExp(user.name)
            .replace(/([&<>"'#])/g, (match) =>escapeMap[match] ))
    const reg = new RegExp(`(@${userListToName.join('|@')})`, 'g')
    return string.replace(reg, '<em class="markup--reply">$1</em>')
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default parseBody;

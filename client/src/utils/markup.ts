import { store } from '../store';

import dompurify from 'dompurify';
import showdown from 'showdown';
import { User } from './types';
import { Emojis } from '../reducers/emojis';

// showdown.setOption('simplifiedAutoLink', true)
// showdown.setOption('excludeTrailingPunctuationFromURLs', true)
showdown.setOption('literalMidWordUnderscores', true)
showdown.setOption('encodeEmails', false)
showdown.setOption('omitExtraWLInCodeBlocks', true)
showdown.setOption('simpleLineBreaks', false)

let postAuthorName = '';

const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;', '#': '\\#', '- ': '\\- ' };
const unescapeMap = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", };

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
    const { list: emotes }: Emojis = store.getState().emojis;
    const emote = emotes.find(e => e.name === match)
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

function parseBody(string: string, params = {} as { postAuthorName: string }): string {
    postAuthorName = params.postAuthorName;
    const parsed = converter.makeHtml(string)
    const parsedWithReplies = getReplies(parsed)
    return dompurify.sanitize(parsedWithReplies, { ADD_ATTR: ['target'], ALLOWED_TAGS: ['a', 'em', 'strong', 'del', 'br', 'img'] });
}

function getReplies(string: string) {
    const userList: User[] = store.getState().chat.users;
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

import { store } from '../store';

import dompurify from 'dompurify';
import showdown from 'showdown';

// showdown.setOption('simplifiedAutoLink', true)
// showdown.setOption('excludeTrailingPunctuationFromURLs', true)
showdown.setOption('literalMidWordUnderscores', true)
showdown.setOption('encodeEmails', false)
showdown.setOption('omitExtraWLInCodeBlocks', true)

let postAuthorName = '';
let userList = [{ name: 'kekw' }];

const escapeMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
const urlEscapeMap = { "%": '%25', ":": '%3A' }
showdown.extension('escapeMap', () => [{ type: 'lang', regex: /([&<>"'])/g, replace: (s, match) => escapeMap[match] }]);

showdown.extension('spoiler', () => [{ type: 'lang', regex: /%%(.+?)%%/gs, replace: `<del class="markup--spoiler">$1</del>` }]);
showdown.extension('bold', () => [{ type: 'lang', regex: /\*\*(.+)\*\*/gs, replace: `<strong class="markup--bold">$1</strong>` }]);
showdown.extension('italic', () => [{ type: 'lang', regex: /\*(.+)\*/gs, replace: `<em class="markup--italic">$1</em>` }]);
showdown.extension('link', () => [{
    type: 'lang', regex: /(http(s)?:\/\/([^\s:])+[^.;\s:,])/gi,
    replace: `<a href="$1" "class="markup--link" target="_blank"">$1</a>`
    // replace(string: string, match: string) {
    //     const escape = match.replace(/[:%]/g, (string) => urlEscapeMap[string])
    //     return `<a href="${escape}" target="_blank"">${escape}</a>`
    // }
}]);
showdown.extension('reply', () => [{ type: 'lang', regex: /(@[^@]+[^@ ])/g, replace: replyReplace }]);

showdown.extension('me', () => [{ type: 'lang', regex: /^\/me (.+)/s, replace: meReplace }]);
showdown.extension('do', () => [{ type: 'lang', regex: /^\/do (.+)/s, replace: doReplace }]);
showdown.extension('emotes', () => [{ type: 'lang', regex: /:([a-zA-Z_0-9]{1,32}):/g, replace: emoteReplace }]);
showdown.extension('quote', () => [{ type: 'lang', regex: /^(&gt;.+?)$/gim, replace: `<em class="markup--quote">$1</em>` }]);

showdown.extension('trailingSpaces', () => [{ type: 'lang', regex: /^\s+/gm, replace: '' }]);
showdown.extension('linebreak', () => [{ type: 'lang', regex: /\n/g, replace: '<br>' }]);
showdown.extension('multiLineBreak', () => [{ type: 'lang', regex: /\n{3,}/g, replace: '\n\n' }]);
showdown.extension('trailingLineBreak', () => [{ type: 'lang', regex: /^\n*/s, replace: '' }])

function emoteReplace(string: string, match: string) {
    const { list: emotes } = store.getState().emojis;
    const emote = emotes.find(e => e.name === match)
    if (emote) return `<img class="emote" src="${emote.path}" title=":${emote.name}:">`
    else return string;
}
function meReplace(_: string, match: string) {
    return `<em class="markup--me">${postAuthorName} ${match}</em>`
}
function doReplace(_: string, match: string) {
    return `<em class="markup--do">${match}</em>`
}
function replyReplace(string: string, match: string) {
    const userList = store.getState().chat.users;
    const user = userList.find(({ name }) => match.substr(1).includes(name))
    if (!user) return match;
    const nameLength = user.name.length + 1;
    const matchWithoutName = match.substr(nameLength);
    return `<em class="markup--reply">@${user.name}</em>${matchWithoutName}`;
}

// @kekw long text
// @kekw

const converter = new showdown.Converter({
    extensions: [
        'trailingLineBreak',
        'multiLineBreak',
        'escapeMap',
        'reply',
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
    return dompurify.sanitize(parsed, { ALLOWED_TAGS: ['a', 'em', 'strong', 'del', 'br', 'img'] });
}

export default parseBody;

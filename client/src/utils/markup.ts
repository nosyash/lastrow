
import { User } from './types';
import { Emoji } from '../reducers/emojis';
import marked from './marked'
marked.setOptions({
    renderer: new marked.Renderer(),
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: true,
    smartLists: false,
    smartypants: false,
    xhtml: false
});


let postAuthorName = '';
let emotes: Emoji[] = []
let userList: User[] = []

// function meReplace(_: string, match: string) {
//     return `<em class="markup--me">${postAuthorName} ${match}</em>`
// }
// function doReplace(_: string, match: string) {
//     const output = match.replace(/\n/g, ' ')
//     return `<em class="markup--do">${output}</em>`
// }

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
    emotes = params.emojis;
    userList = params.userList;
    const parsed = marked(input, { emotes, postAuthorName })
    const parsedWithReplies = getReplies(parsed)

    cacheInstance.cacheMarkup(input, parsedWithReplies)

    return parsedWithReplies
}

function getReplies(string: string) {
    // const userList: User[] = store.getState().chat.users;
    if (userList.length === 0) {
        return string;
    }

    // const userListToName =
    //     userList.map(user => escapeRegExp(user.name)
    //         .replace(/([&<>"'#])/g, (match) =>escapeMap[match] ))
    const userListToName = userList.map(user => user.name)
    const reg = new RegExp(`(@${userListToName.join('|@')})`, 'g')
    return string.replace(reg, '<em class="markup--reply">$1</em>')
}

export default parseBody;

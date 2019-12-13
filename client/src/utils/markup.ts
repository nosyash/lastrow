
import { User } from './types';
import { Emoji } from '../reducers/emojis';
import marked from './marked'
import twemoji from 'twemoji'

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

class Parser {
    constructor(public string: string) {}

    markup(opts: any) {
        this.string = marked(this.string, opts)
        return this
    }
    replies() {
        this.string = getReplies(this.string)
        return this
    }
    twemoji(opts: any) {
        this.string = twemoji.parse(this.string, opts)
        return this
    }

    output() {
        return this.string
    }
}

function parseBody(input: string, params = {} as { postAuthorName: string; emojis: Emoji[]; userList: User[] }): string {
    const cachedBody = cacheInstance.getCachedMarkup(input)
    if (cachedBody) {
        return cachedBody
    }

    postAuthorName = params.postAuthorName;
    emotes = params.emojis;
    userList = params.userList;
    const output = new Parser(input)
        .markup( { emotes, postAuthorName })
        .replies()
        .twemoji({ className: 'emote twemoji'})
        .output()

    // because replies are not parsed yet if there is no users
    if (userList.length > 0) {
        cacheInstance.cacheMarkup(input, output)
    }

    return output
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

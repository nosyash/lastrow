import { Emoji } from '../reducers/emojis';
import parseBody from '../utils/markup';
import { User } from '../utils/types';
import mustache from 'mustache'
import cn from 'classnames'

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import template from '!raw-loader!../mustache/chat-message.mustache'

export default class MessageContext {
    private fields: {
        body: string;
        showHeader: boolean;
        userId: string;
        name: string;
        color: string;
        avatarUrl: string;
        classes: string;
    }

    constructor(
        color: string,
        avatarUrl: string,
        showHeader: boolean,
        userId: string,
        messageId: number,
        online: boolean,
        highlight: boolean,
        message: string,
        name: string,
        emojiList: Emoji[],
        userList: User[],
    ) {
        this.fields = {
            showHeader,
            userId: userId,
            name: name,
            color: color,
            avatarUrl: avatarUrl,
            classes: cn({ highlight, online, offline: !online }),
            body: parseBody(message, { postAuthorName: name, emojis: emojiList, userList })
        }
    }

    public render(): string {
        return mustache.render(template, this.fields)
    }
}

import { Emoji } from '../reducers/emojis';
import parseBody from '../utils/markup';
import { User } from '../utils/types';
import mustache from 'mustache'
import cn from 'classnames'

import template from '!raw-loader!../mustache/chat-message.mustache'

interface MessageContextProps {
    color: string;
    avatarUrl: string;
    showHeader: boolean;
    userId: string;
    messageId: number;
    online: boolean;
    message: string;
    name: string;
    emojiList: Emoji[];
    userList: User[];
    mainUserName: string;
}

export default class MessageContext {
    private templateFields: {
        body: string;
        showHeader: boolean;
        userId: string;
        name: string;
        color: string;
        avatarUrl: string;
        classes: string;
    }

    constructor(props: MessageContextProps) {
        const highlight = props.message.includes(`@${props.mainUserName}`)
        this.templateFields = {
            avatarUrl: props.avatarUrl,
            color: props.color,
            name: props.name,
            showHeader: props.showHeader,
            userId: props.userId,
            classes: cn({ highlight, online: props.online, offline: !props.online }),
            body: parseBody(props.message, { postAuthorName: name, emojis: props.emojiList, userList: props.userList }),
        }
    }

    public render(): string {
        return mustache.render(template, this.templateFields)
    }
}

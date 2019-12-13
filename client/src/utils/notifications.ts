import ls from 'local-storage';
import { notify } from '.';

const faviconEl = document.getElementById('favicon') as HTMLLinkElement
const initialHref = faviconEl.href

class Notification {
    replies: boolean;
    unread: boolean;
    currentTitle: string;
    constructor() {
        this.replies = false;
        this.unread = false;
        this.currentTitle = document.title;
        window.addEventListener('focus', this.removeNotifications);
    }

    addUnread() {
        this.unread = true;
        this.makeNotification();
    }

    addReplies() {
        this.replies = true;
        this.makeNotification();

        // if ((ls as any).get('notify')) notify(`Reply by ${name}`, { body: message, icon: image });
    }

    removeNotifications = () => {
        this.unread = false;
        this.replies = false;
        this.makeNotification();
    };

    setCurrentTitle(title) {
        this.currentTitle = title;
        document.title = title;
    }

    makeNotification() {
        if (this.replies) {
            this.changeTitle('replies')
            this.changeIcon('replies')
        } else if (!this.replies && this.unread) {
            this.changeTitle('unread')
            this.changeIcon('unread')
        } else if (!this.replies && !this.unread) {
            this.changeTitle('')
            this.changeIcon('')
        }
    }

    changeTitle(option: string) {
        if (option === 'replies') document.title = `** ${this.currentTitle}`;
        if (option === 'unread') document.title = `* ${this.currentTitle}`;
        if (option === '') document.title = this.currentTitle;
    }

    changeIcon(option: string) {
        if (option === 'replies') faviconEl.setAttribute('href', '/icons/reply.png')
        if (option === 'unread') faviconEl.setAttribute('href', '/icons/unread.png')
        if (option === '') faviconEl.setAttribute('href', initialHref)
    }
}

export default new Notification();

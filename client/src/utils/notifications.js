import ls from 'local-storage';
import { notify } from './base';

class Notification {
  constructor() {
    this.replies = false;
    this.unread = false;
    this.currentTitle = document.title;
    window.addEventListener('focus', this.removeNotifications);
  }

  addUnread() {
    this.unread = true;
    this._changeTitle();
  }

  addReplies({ name, body, image }) {
    this.replies = true;
    this._changeTitle();

    if (ls.get('notify')) notify(`Reply by ${name}`, { body, icon: image });
  }

  removeNotifications = () => {
    this.unread = false;
    this.replies = false;
    this._changeTitle();
  };

  setCurrentTitle(title) {
    this.currentTitle = title;
    document.title = title;
  }

  _changeTitle() {
    if (this.replies) document.title = `** ${this.currentTitle}`;
    if (!this.replies && this.unread) document.title = `* ${this.currentTitle}`;
    if (!this.replies && !this.unread) document.title = this.currentTitle;
  }
}

export default new Notification();

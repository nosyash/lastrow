import { Component } from 'react';
import playSound from '../../../../../utils/HandleSounds';
import notifications from '../../../../../utils/notifications';
import parse from 'html-react-parser';

interface MessageProps {
    // online: boolean;
    // image: string;
    // highlight: boolean;
    selfName: string;
    // message: string;
    // name: string;
    html: string;
}

class Message extends Component<MessageProps, any> {

    shouldComponentUpdate() {
        return false
    }
    shown = false;

    pageIsVisible = () => document.visibilityState === 'visible';

    // handleSounds = () => {
    //     if (this.shown) return;
    //     if (this.pageIsVisible()) return

    //     playSound();
    // };


    handleNotification = (highlight: boolean) => {
        if (this.shown) return;
        this.shown = true;

        if (highlight) notifications.addReplies();
        else notifications.addUnread();
    };

    componentDidMount() {
        const { html, selfName } = this.props;

        if (this.pageIsVisible()) return;

        const hasYourName = html.includes(`@${selfName}`);
        const hasEveryone = html.includes(`@everyone`);
        this.handleNotification(hasYourName || hasEveryone)
    }

    render() {
        const { html } = this.props;
        if (!html) return null
        return parse(html)
    }
}
export default Message

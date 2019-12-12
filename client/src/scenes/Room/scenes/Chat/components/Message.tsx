import React, { Component } from 'react';
import { connect } from 'react-redux';
import playSound from '../../../../../utils/HandleSounds';
import notifications from '../../../../../utils/notifications';
import { Emoji } from '../../../../../reducers/emojis';
import { workerRequest } from '../../../../../worker';
import parse from 'html-react-parser';
import { State } from '../../../../../reducers';

interface MessageProps {
    online: boolean;
    color: string;
    image: string;
    renderHeader: boolean;
    id: string;
    messageId: string;
    highlight: boolean;
    message: string;
    name: string;
    html: string;
    emojiList: Emoji[];
}

class Message extends Component<MessageProps, any> {
    shown = false;

    pageIsVisible = () => document.visibilityState === 'visible';

    handleSounds = () => {
        if (this.shown) return;
        if (this.pageIsVisible()) return

        playSound();
    };

    handleNotification = (highlight, opts) => {
        if (this.shown) return;
        this.shown = true;
        if (this.pageIsVisible()) return;
        if (highlight) notifications.addReplies(opts);
        else notifications.addUnread();
    };

    componentDidMount() {
        const { image, highlight, message, name } = this.props;

        this.handleNotification(highlight, { name, body: message, image });
    }

    render() {
        const { html } = this.props;
        if (!html) return null
        return parse(html)
    }
}

function mapStateToProps(state: State) {
    return { emojiList: state.emojis.list };
}

export default connect(mapStateToProps)(Message);

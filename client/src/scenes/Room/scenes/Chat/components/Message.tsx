import React, { Component } from 'react';
import { connect } from 'react-redux';
import safelySetInnerHTML from '../../../../../utils/safelySetInnerHTML ';
import parseBody from '../../../../../utils/markup';
import playSound from '../../../../../utils/HandleSounds';
import notifications from '../../../../../utils/notifications';
import { Emoji } from '../../../../../reducers/emojis';

interface MessageProps {
    online: boolean;
    color: string;
    image: string;
    renderHeader: boolean;
    id: string;
    highlight: boolean;
    body: string;
    name: string;
    emojiList: Emoji[]
}

class Message extends Component<MessageProps, any> {
    shown = false;
    bodyMarked = '';

    getClassNames = classes => {
        const { online } = classes;
        let { highlight } = classes;

        const onlineClass = online ? 'online' : 'offline';
        highlight = highlight ? 'highlight' : '';

        return { className: `chat-message ${onlineClass} ${highlight}` };
    };

    getStyles = (image: string, color: string) => {
        const backgroundImage = image ? `url(${image})` : '';
        const backgroundColor = color;

        return { backgroundImage, backgroundColor };
    };

    pageIsVisible = () => document.visibilityState === 'visible';

    handleSounds = highlight => {
        if (this.shown) return;
        if (highlight && !this.pageIsVisible()) {
            playSound();
        }
    };

    handleNotification = (highlight, opts) => {
        if (this.shown) return;
        this.shown = true;
        if (this.pageIsVisible()) return;
        if (highlight) notifications.addReplies(opts);
        else notifications.addUnread();
    };

    render() {
        const { online, color, image, highlight, body } = this.props;
        const { name, emojiList } = this.props;

        // this.handleSounds(highlight);
        this.handleNotification(highlight, { name, body, image });

        // Markup cache
        if (!this.bodyMarked) this.bodyMarked = parseBody(body, { postAuthorName: name });
        const renderMessageArgs = {
            ...this.getStyles(image, color),
            ...this.getClassNames({ online, highlight }),
            bodyMarked: this.bodyMarked,
        };
        return <RenderMessage {...renderMessageArgs} {...this.props} />
    }
}

function mapStateToProps(state) {
    return { emojiList: state.emojis.list };
}

export default connect(mapStateToProps)(Message);

const RenderMessage = props => {
    const { color, className, backgroundColor, backgroundImage } = props;
    const { _ref, id, name, bodyMarked } = props;
    const { renderHeader, hideHeader } = props;
    const { handleProfile, onAvatarClick } = props;
    return (
        <div data-id={id} className={className}>
            {renderHeader && !hideHeader && (
                <div className="chat-message_header">
                    <div
                        style={{ backgroundImage, backgroundColor }}
                        onClick={onAvatarClick}
                        className="chat-avatar"
                    />
                    <span
                        ref={_ref}
                        data-name={name}
                        onClick={handleProfile}
                        style={{ color }}
                        className="chat-name reply-trigger"
                    >
                        {name}
                    </span>
                </div>
            )}
            <div className="chat-message_body">
                <p className="chat-message_p" dangerouslySetInnerHTML={{ __html: bodyMarked }}></p>
            </div>
        </div>
    );
};

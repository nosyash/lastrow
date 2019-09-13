import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import safelySetInnerHTML from '../../../utils/safelySetInnerHTML ';
import parseMarkup from '../../../utils/markup';
import playSound from '../../../utils/HandleSounds';
import notifications from '../../../utils/notifications';

class Message extends PureComponent {
  shown = false;

  getClassNames = classes => {
      const { online } = classes;
      let { highlight } = classes;

      const onlineClass = online ? 'online' : 'offline';
      highlight = highlight ? 'highlight' : '';

      return { className: `chat-message ${onlineClass} ${highlight}` };
  };

  getStyles = (image, color) => {
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

      const renderMessageArgs = {
          ...this.getStyles(image, color),
          ...this.getClassNames({ online, highlight }),
          ...parseMarkup({ body, emojiList, name }),
      };
      return <RenderMessage {...renderMessageArgs} {...this.props} />;
  }
}

function mapStateToProps(state) {
    return { emojiList: state.emojis.list };
}

export default connect(mapStateToProps)(Message);

const RenderMessage = props => {
    const { color, className, backgroundColor, backgroundImage } = props;
    const { _ref, id, name, tempBody } = props;
    const { renderHeader, hideHeader } = props;
    const { handleProfile } = props;
    return (
        <div data-id={id} className={className}>
            {renderHeader && !hideHeader && (
                <div className="chat-message_header">
                    <div style={{ backgroundImage, backgroundColor }} className="chat-avatar" />
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
            <div className="chat-message_body">{safelySetInnerHTML(tempBody)}</div>
        </div>
    );
};

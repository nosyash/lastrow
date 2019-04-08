import React, { Component } from 'react';
import { connect } from 'react-redux';
import safelySetInnerHTML from '../../../utils/safelySetInnerHTML ';
import parseMarkup from '../../../utils/markup';
import playSound from '../../../utils/HandleSounds';

class ChatMessage extends Component {
  // shouldComponentUpdate(nextProps, nextState) {
  //   const { tempBody } = this.state;
  // if (nextState.tempBody !== tempBody) return true;
  // return false;
  // }

  getClassName = classes => {
    const { online } = classes;
    let { highlight } = classes;
    const onlineClass = online ? 'online' : 'offline';
    if (highlight) highlight = highlight ? 'highlight' : '';
    return `chat-message ${onlineClass} ${highlight}`;
  };

  render() {
    const { online, color = '#666768', image, highlight, body } = this.props;
    const { name, emojiList } = this.props;

    const backgroundImage = image ? `url(${image})` : '';
    const backgroundColor = color;

    const pageVissible = document.visibilityState === 'visible';
    if (highlight && !pageVissible) playSound();

    const className = this.getClassName({ online, highlight });
    const { tempBody, hideHeader } = parseMarkup({ body, emojiList, name });
    // this.setState({ tempBody });
    const args = {
      backgroundImage,
      backgroundColor,
      className,
      tempBody,
      hideHeader,
    };

    return <RenderMessage {...args} {...this.props} />;
  }
}

function mapStateToProps(state) {
  return { emojiList: state.emojis.list };
}

export default connect(mapStateToProps)(ChatMessage);

const RenderMessage = props => {
  const { color, className, backgroundColor, backgroundImage } = props;
  const { _ref, id, name, tempBody } = props;
  const { renderHeader, hideHeader } = props;
  const { handleProfile } = props;
  return (
    <React.Fragment>
      <div _id={id} className={className}>
        {renderHeader && !hideHeader && (
          <div className="chat-message_header">
            <div
              style={{ backgroundImage, backgroundColor }}
              className="chat-avatar"
            />
            <span
              ref={_ref}
              onClick={handleProfile}
              style={{ color }}
              className="chat-name"
            >
              {name}
              <i data-name={name} className="chat-message_reply fa fa-reply" />
            </span>
          </div>
        )}
        <div className="chat-message_body">{safelySetInnerHTML(tempBody)}</div>
      </div>
    </React.Fragment>
  );
};

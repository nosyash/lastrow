import React from 'react';

function getStyles(image, color) {
  const backgroundImage = image ? `url(${image})` : '';
  const backgroundColor = !image ? color : '';
  return { backgroundColor, backgroundImage }
}

const MiniProfile = ({ currentProfile }) => {
  const { name, image, color } = currentProfile;
  const { backgroundColor, backgroundImage } = getStyles(image, color);

  return (
    <div className="mini-profile">
      <div
        style={{ backgroundColor, backgroundImage }}
        className="chat-avatar"
      />
      {name && (
        <span style={{ color }} className="chat-name">
          {name}
        </span>
      )}
      {!name && (
        <div className="ml-auto mr-auto spinner-grow" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      )}
      <span
        data-name={name}
        title="Reply"
        style={{ color }}
        className="control chat-message_reply"
      >
        <i className="fa fa-reply" />
      </span>
    </div>
  );
};

export default MiniProfile;

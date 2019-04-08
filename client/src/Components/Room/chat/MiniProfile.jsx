import React from 'react';

const MiniProfile = ({ currentProfile }) => {
  const { name, image, color = '#666768' } = currentProfile;
  const backgroundImage = image ? `url(${image})` : '';
  const backgroundColor = !image ? color : '';
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
    </div>
  );
};

export default MiniProfile;

import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import MiniProfile from './MiniProfile';

function ChatHeader({ userList }) {
  const [showProfile, setShowProfile] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(0);

  useEffect(() => {
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  });

  function handleClick({ target }) {
    const isUserIcon = target.closest('.user-icon');
    const isMenuProfile = target.closest('.mini-profile');
    if (!isUserIcon && !isMenuProfile) {
      setShowProfile(false);
    }
  }

  function handleUserClick(userProfile) {
    setShowProfile(true);
    setCurrentProfile(userProfile);
  }

  function handleHideProfile() {
    requestAnimationFrame(() => setShowProfile(false));
  }

  return (
    <div className="chat-header">
      {showProfile && !currentProfile.guest && (
        <MiniProfile hideProfile={handleHideProfile} currentProfile={currentProfile} />
      )}
      <div className="chat-header_userlist">
        {userList.map((userProfile, index) => (
          <UserIcon
            onClick={() => handleUserClick(userProfile)}
            key={index}
            name={userProfile.name}
            color={userProfile.color}
            guest={userProfile.guest}
          />
        ))}
      </div>
      <div className="chat-header_arrow">
        <i className="fa fa-angle-down" />
      </div>
    </div>
  );
}

function UserIcon({ id, onClick, name, color, guest }) {
  const classes = `fa fa-user${guest ? '-secret' : ''}`;

  return (
    <span onClick={() => onClick(id)} title={name} _id={id} className="user-icon">
      <i className={classes} style={{ color }} />
    </span>
  );
}

const mapStateToProps = state => ({ userList: state.Chat.users });

export default connect(mapStateToProps)(ChatHeader);

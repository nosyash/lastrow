import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import MiniProfile from './MiniProfile';

function ChatHeader(props) {
  const [showProfile, setShowProfile] = useState(false)
  const [currentProfile, setCurrentProfile] = useState(0)

  useEffect(() => {
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    }
  })

  function handleClick(e) {
    const { target } = e;
    if (!target.closest('.user-icon') && !target.closest('.mini-profile')) {
      setShowProfile(false)
    }
  };

  function handleUserClick(userProfile) {
    setShowProfile(true);
    setCurrentProfile(userProfile)
  };

  const { userList } = props;
  return (
    <div className="chat-header">
      {showProfile && !currentProfile.guest && (
        <MiniProfile currentProfile={currentProfile} />
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

function UserIcon(props) {
  const { id, onClick, name, color, guest } = props;
  return (
    <span
      onClick={() => onClick(id)}
      title={name}
      _id={id}
      className="user-icon"
    >
      <i style={{ color }} className={classes} />
    </span>
  );
}

const mapStateToProps = state => ({ userList: state.Chat.users });

export default connect(mapStateToProps)(ChatHeader);

import React, { Component } from 'react';
import { connect } from 'react-redux';
import MiniProfile from './MiniProfile';

class ChatHeader extends Component {
  state = {
    showProfile: false,
    currentProfile: 0,
  };

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClick);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClick);
  }

  handleClick = e => {
    const { target } = e;
    if (!target.closest('.user-icon') && !target.closest('.mini-profile')) {
      this.setState({ showProfile: false });
    }
  };

  handleUserClick = userProfile => {
    this.setState({ showProfile: true, currentProfile: userProfile });
  };

  render() {
    const { showProfile, currentProfile } = this.state;
    const { userList } = this.props;
    return (
      <React.Fragment>
        <div className="chat-header">
          {showProfile && <MiniProfile currentProfile={currentProfile} />}
          <div className="chat-header_userlist">
            {userList.map((userProfile, index) => (
              <UserIcon
                onClick={() => this.handleUserClick(userProfile)}
                key={index}
                name={userProfile.name}
                color={userProfile.color}
              />
            ))}
          </div>
          <div className="chat-header_arrow">
            <i className="fa fa-angle-down" />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

class UserIcon extends Component {
  render() {
    const { id, onClick, name, color } = this.props;
    return (
      <span
        onClick={() => onClick(id)}
        title={name}
        _id={id}
        className="user-icon"
      >
        <i style={{ color }} className="fa fa-user" />
      </span>
    );
  }
}

const mapStateToProps = state => ({ userList: state.Chat.users });

export default connect(mapStateToProps)(ChatHeader);

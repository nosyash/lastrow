import React, { Component } from 'react';
import { connect } from 'react-redux';
import MiniProfile from './MiniProfile';

class ChatHeader extends Component {
  state = {
    showProfile: false,
    currentProfileId: 0,
  };

  componentDidMount() {
    document.addEventListener('click', this.handleClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClick);
  }

  handleClick = e => {
    const { target } = e;
    if (!target.closest('.user-icon') && !target.closest('.mini-profile'))
      this.setState({ showProfile: false });
  };

  handleUserClick = id => {
    this.setState({ showProfile: true, currentProfileId: id });
  };

  render() {
    const { showProfile, currentProfileId } = this.state;
    const { userList } = this.props;
    return (
      <React.Fragment>
        <div className="chat-header">
          {showProfile && <MiniProfile id={currentProfileId} />}
          <div className="chat-header_userlist">
            {userList.map((u, i) => (
              <UserIcon
                onClick={() => this.handleUserClick(u.id)}
                key={i}
                name={u.name}
                // id={u.id}
                color={u.name_color}
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
      <span onClick={() => onClick(id)} title={name} _id={id} className="user-icon">
        <i style={{ color }} className="fa fa-user" />
      </span>
    );
  }
}

const mapStateToProps = state => ({ userList: state.Chat.users });

export default connect(mapStateToProps)(ChatHeader);

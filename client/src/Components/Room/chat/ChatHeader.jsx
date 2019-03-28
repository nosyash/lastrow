import React, { Component } from 'react';
import MiniProfile from './MiniProfile';

class ChatHeader extends Component {
  constructor() {
    super();
    this.list = [
      { name: 'AYAYA', color: '#DA3F6E', id: 1 },
      { name: 'AYAYA', color: '#DA3F6E', id: 2 },
      { name: 'AYAYA', color: '#DA3F6E', id: 3 },
      { name: 'AYAYA', color: '#DA3F6E', id: 4 },
      { name: 'AYAYA', color: '#DA3F6E', id: 5 },
      { name: 'AYAYA', color: '#DA3F6E', id: 6 },
      { name: 'AYAYA', color: '#DA3F6E', id: 7 },
      { name: 'AYAYA', color: '#DA3F6E', id: 8 },
      { name: 'AYAYA', color: '#DA3F6E', id: 9 },
      { name: 'AYAYA', color: '#DA3F6E', id: 10 },
      { name: 'AYAYA', color: '#DA3F6E', id: 11 },
      { name: 'AYAYA', color: '#DA3F6E', id: 12 },
      { name: 'AYAYA', color: '#DA3F6E', id: 13 },
      { name: 'AYAYA', color: '#DA3F6E', id: 14 },
      { name: 'AYAYA', color: '#DA3F6E', id: 15 },
      { name: 'AYAYA', color: '#DA3F6E', id: 16 },
      { name: 'AYAYA', color: '#DA3F6E', id: 17 },
      { name: 'AYAYA', color: '#DA3F6E', id: 18 },
    ];
  }

  state = {
    showProfile: false,
    currentProfileId: 0,
    profileList: [],
  };

  componentDidMount() {
    document.addEventListener('click', this.handleClick);
    // console.log('fetch data from server');
    this.setState({ profileList: this.list });
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
    const { showProfile, currentProfileId, profileList } = this.state;
    return (
      <React.Fragment>
        <div className="chat-header">
          {showProfile && <MiniProfile id={currentProfileId} />}
          <div className="chat-header_userlist">
            {profileList.map(o => (
              <UserIcon
                onClick={() => this.handleUserClick(o.id)}
                key={o.id}
                name={o.name}
                id={o.id}
                color={o.color}
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
  state = {
    // id: '',
    name: '',
    color: '',
  };

  componentDidMount() {
    // const { id } = this.props;
    console.log('fetch data from server');
  }

  render() {
    const { id, onClick } = this.props;
    const { name, color = '#666768' } = this.state;
    return (
      <span onClick={() => onClick(id)} title={name} _id={id} className="user-icon">
        <i style={{ color }} className="fa fa-user" />
      </span>
    );
  }
}

export default ChatHeader;

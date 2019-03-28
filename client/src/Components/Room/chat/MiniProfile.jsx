import React, { Component } from 'react';

class MiniProfile extends Component {
  state = {
    id: '',
    name: '',
    avatarURL: '',
    color: '',
  };

  componentDidMount() {
    // const { id } = this.props;
    console.log('fetch data from server');
  }

  componentDidUpdate() {
    // const { id } = this.props;
    console.log('fetch data from server');
  }

  render() {
    // const { profileId } = this.props;
    const { id, name, avatarURL, color } = this.state;
    const backgroundImage = `url(${avatarURL})`;
    const backgroundColor = avatarURL ? '' : color;
    return (
      <div className="mini-profile">
        <div style={{ backgroundColor, backgroundImage }} className="chat-avatar" />
        {id && <span className="chat-name">{name}</span>}
        {!id && (
          <div className="ml-auto mr-auto spinner-grow" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        )}
      </div>
    );
  }
}

export default MiniProfile;

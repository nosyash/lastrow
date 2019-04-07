import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as types from '../../constants/ActionTypes';
import ProfileSettings from './ProfileSettings';

class ControlPanel extends Component {
  state = {};

  handleProfileSettings = () => {
    const { addPopup } = this.props;
    const id = 'profile-settings';
    addPopup({
      id,
      el: <ProfileSettings id={id} />,
      width: 500,
      height: 500,
    });
  };

  render() {
    const { profile } = this.props;
    return <RenderProfile onProfileSettings={this.handleProfileSettings} profile={profile} />;
  }
}

const RenderProfile = ({ profile, onProfileSettings }) => {
  const { name, image, color } = profile;
  const backgroundColor = color;
  const backgroundImage = `url(${image})`;
  return (
    <div className="control-panel_container">
      <div className="mini-profile">
        <div style={{ backgroundColor, backgroundImage }} className="chat-avatar" />
        <div className="mini-profile_second-section">
          <span style={{ color }} className="chat-name">
            {name}
          </span>
          <div className="controls-container">
            <span onClick={onProfileSettings} className="control">
              <i className="fas fa-users-cog" />
            </span>
            <span className="control">
              <i className="fas fa-cog" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => ({ profile: state.profile });

const mapDispatchToProps = {
  addPopup: payload => ({ type: types.ADD_POPUP, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ControlPanel);

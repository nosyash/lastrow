import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as types from '../../constants/ActionTypes';

function ControlPanel(props) {
  function handleClick(id) {
    switch (id) {
      case 'showPlaylist':
        return props.togglePopup('playlist');
      case 'addToPlaylist':
        return props.togglePopup('addMedia');

      default:
        break;
    }
  }

  const { profile, playlist } = props;
  const upNext = playlist[0] || { title: '', url: '' };
  const { logged } = profile;
  return (
    <div className="control-panel_container">
      <RenderPlaylister upNext={upNext} logged={logged} onClick={handleClick} />
      <div className="divider" />
      {logged && (
        <RenderProfile
          logged={logged}
          onProfileSettings={() => props.addPopup('profileSettings')}
          profile={profile}
        />
      )}
    </div>
  );
}

const RenderPlaylister = ({ onClick, logged, upNext }) => (
  <div className="playlister">
    <RenderItem
      dataId="showPlaylist"
      onClick={onClick}
      classes="control-svg show-playlist-icon"
      text="Show Playlist"
    />
    {logged && (
      <RenderItem
        dataId="addToPlaylist"
        onClick={onClick}
        classes="control-svg add-to-playlist-icon"
        text="Add To Playlist"
      />
    )}
    <div className="item">
      <div>Up next:</div>
      <a className="control" target="_blank" rel="noopener noreferrer" href={upNext.url}>
        {upNext.title}
      </a>
      {/* <i className="fa fa-arrow-right" /> */}
    </div>
  </div>
);

const RenderItem = ({ classes, onClick, dataId, text }) => (
  <div>
    <span onClick={() => onClick(dataId)} className="control item">
      <span className={classes} />
      {text}
    </span>
  </div>
);

const RenderProfile = ({ profile, onProfileSettings }) => {
  const { name, image, color } = profile;
  const backgroundColor = color;
  const backgroundImage = `url(${image})`;
  return (
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
  );
};

const mapStateToProps = state => ({
  profile: state.profile,
  playlist: state.Media.playlist,
});

const mapDispatchToProps = {
  addPopup: payload => ({ type: types.ADD_POPUP, payload }),
  togglePopup: payload => ({ type: types.TOGGLE_POPUP, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ControlPanel);

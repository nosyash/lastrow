import React, { Component } from 'react';
import { connect } from 'react-redux';
import { formatTime } from '../../../utils/base';
// import * as types from '../../constants/ActionTypes';

class Playlist extends Component {
  state = {};

  renderElement = (element, i) => (
    <div key={i} className="paylist-item">
      <a className="control" target="_blank" rel="noopener noreferrer" href={element.url}>
        {element.title || element.url}
      </a>
      <span className="playlist-item__duration">{formatTime(element.duration)}</span>
    </div>
  );

  render() {
    const { playlist } = this.props;
    return (
      <div className="popup-element playlist_container">
        {playlist.map((element, i) => this.renderElement(element, i))}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  playlist: state.Media.playlist,
});

export default connect(mapStateToProps)(Playlist);

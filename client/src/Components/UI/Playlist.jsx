import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as types from '../../constants/ActionTypes';

class Playlist extends Component {
  state = {};

  renderElement = (element, i) => (
    <div key={i} className="paylist-item">
      <a className="control" target="_blank" rel="noopener noreferrer" href={element.url}>
        {element.title}
      </a>
    </div>
  );

  render() {
    const { playlist } = this.props;
    return (
      <div className="float-element playlist_container">
        {playlist.map((element, i) => this.renderElement(element, i))}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  playlist: state.Media.playlist,
});

export default connect(mapStateToProps)(Playlist);

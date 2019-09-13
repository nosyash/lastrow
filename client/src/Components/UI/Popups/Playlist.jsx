import React, { Component } from 'react';
import { connect } from 'react-redux';
import { formatTime } from '../../../utils/base';
import { webSocketSend } from '../../../actions';
import * as api from '../../../constants/apiActions';
import AddMedia from './AddMedia';

class Playlist extends Component {
  state = {};

  handleDelete = ({ __id }) => {
    const { uuid } = this.props;
    webSocketSend(api.DELETE_VIDEO_FROM_PLAYLIST({ __id, uuid }));
  };

  renderElement = (element, i) => (
    <div key={i} className="paylist-item">
      <a className="control" target="_blank" rel="noopener noreferrer" href={element.url}>
        {element.title || element.url}
      </a>
      <span className="playlist-item__duration">{formatTime(element.duration)}</span>
      <span
        onClick={() => this.handleDelete(element)}
        className="control playlist-item__remove-icon"
      >
        <i className="fa fa-times"></i>
      </span>
    </div>
  );

  render() {
    const { playlist } = this.props;
    return (
      <div className="popup-element playlist_container">
        {<AddMedia />}
        {!playlist.length && <p>No items</p>}
        {playlist.map((element, i) => this.renderElement(element, i))}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  playlist: state.Media.playlist,
  uuid: state.profile.uuid,
});

export default connect(mapStateToProps)(Playlist);

import React, { Component } from 'react';
import Player from './Player';

export default class VideoContainer extends Component {
  render() {
    const { videoRef } = this.props;
    return (
      <div ref={videoRef} className="video-container">
        <div className="video-element">
          <Player />
        </div>
      </div>
    );
  }
}

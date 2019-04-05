/* eslint-disable jsx-a11y/media-has-caption */
import React, { Component } from 'react';
import Player from './Player';

class VideoContainer extends Component {
  render() {
    const { videoRef, children } = this.props;
    return (
      <div ref={videoRef} className="video-container">
        <div className="video-element">
          <Player />
        </div>
        {children}
      </div>
    );
  }
}

export default VideoContainer;

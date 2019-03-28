/* eslint-disable jsx-a11y/media-has-caption */
import React, { Component } from 'react';
import Player from './Player';

class VideoContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.videoItem = React.createRef();
  }

  handlePlaying = e => {
    console.log(e);
  };

  render() {
    const { videoRef, children } = this.props;
    return (
      <div ref={videoRef} className="video-container">
        {/* <iframe
          title="youtube"
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/auSqkoStjgU"
          frameBorder="0"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        /> */}
        <div className="video-element">
          {/* <video
            ref={this.videoItem}
            className="video"
            controls={false}
            src="https://stream.bona.cafe/uzzu/ep20.mp4"
            autoPlay={false}
            onPlaying={this.handlePlaying}
          />
          <div className="video-overlay" /> */}
          <Player videoItem={this.videoItem} />
        </div>
        {children}
      </div>
    );
  }
}

export default VideoContainer;

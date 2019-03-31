import React, { Component } from 'react';
import { connect } from 'react-redux';
import ReactPlayer from 'react-player';
import * as types from '../../../constants/ActionTypes';
import { formatTime } from '../../../utils/base';

class Player extends Component {
  constructor() {
    super();
    this.videoEl = null;
    this.player = null;
  }

  state = {
    progress: '0%',
  };

  handleReady = () => {
    this.updateTime();
  };

  updateTime = () => {
    const { UpdatePlayer } = this.props;

    this.videoEl = this.player.getInternalPlayer();
    const duration = this.player.getDuration();
    const currentTime = this.player.getCurrentTime();

    UpdatePlayer({ duration, currentTime });
  };

  handlePlaying = p => {
    const { UpdatePlayer } = this.props;
    const { played: progress, playedSeconds: currentTime } = p;

    this.setState({ progress });
    UpdatePlayer({ currentTime });
  };

  render() {
    return (
      <React.Fragment>
        {this.renderPlayer()}
        {this.renderPlayerGUI()}
      </React.Fragment>
    );
  }

  renderPlayer = () => {
    const { media } = this.props;
    return (
      <ReactPlayer
        ref={player => (this.player = player)}
        className="player-inner"
        width="100%"
        height="100%"
        autoPlay={false}
        progressInterval={550}
        onProgress={this.handlePlaying}
        controls
        onReady={this.handleReady}
        playing={media.playing}
        volume={media.volume}
        url={media.url}
        config={{
          youtube: {
            playerVars: { autoplay: 0, controls: 1 },
            preload: true,
          },
        }}
      />
    );
  };

  renderPlayerGUI = () => {
    const { media } = this.props;
    const { progress } = this.state;
    return (
      <div className="video-player">
        <div className="progress-bar_container">
          <div className="progress-bar">
            <ProgressBar progress={progress} />
          </div>
        </div>
        <div className="video-time_container">
          <div className="current-time">{formatTime(media.currentTime)}</div>
          <div className="duration">{formatTime(media.duration)}</div>
        </div>
        <div className="video-player_overflow" />
      </div>
    );
  };
}

class ProgressBar_ extends Player {
  render() {
    const { progress } = this.props;
    const width = `${progress * 100}%`;
    return (
      <React.Fragment>
        <div style={{ width }} className="progress-bar_passed">
          <div className="scrubber_container">
            <div className="scrubber" />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => ({
  media: state.Media,
});

const mapDispatchToProps = {
  UpdatePlayer: payload => ({ type: types.UPDATE_MEDIA, payload }),
  UpdateMediaURL: payload => ({ type: types.UPDATE_MEDIA_URL, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Player);

const ProgressBar = connect(mapStateToProps)(ProgressBar_);

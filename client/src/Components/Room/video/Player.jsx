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
    this.animRef = null;
    this.updatePosition = null;
  }

  state = {
    progress: 0,
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

  handlePlay = () => {
    // this.updatePosition();
  };

  render() {
    return (
      <React.Fragment>
        {this.renderPlayer()}
        {this.player && this.videoEl && this.renderPlayerGUI()}
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
        progressInterval={850}
        onProgress={this.handlePlaying}
        // onSeek={this.updatePosition}
        controls
        muted={media.muted}
        loop
        onPlay={this.handlePlay}
        onPause={this.handlePause}
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

  renderPlayerGUI = () => (
    <div className="video-player">
      {this.renderVideoTop()}
      {this.renderVideoMid()}
      <div className="video-player_overflow" />
    </div>
  );

  renderVideoTop = () => {
    const { media } = this.props;
    const { progress } = this.state;
    return (
      <div className="video-player_top">
        <div className="video-time current-time">{formatTime(media.currentTime)}</div>
        <div className="progress-bar_container">
          <div className="progress-bar">
            <ProgressBar
              setUpdater={callback => (this.updatePosition = callback)}
              animReef={this.animRef}
              player={this.player}
              progress={progress}
            />
          </div>
        </div>
        <div className="video-time duration">{formatTime(media.duration)}</div>
      </div>
    );
  };

  renderVideoMid = () => {
    const { media, SwitchPlay } = this.props;
    return (
      <div className="video-player_mid">
        {this.renderVolumeControl()}
        <div onClick={SwitchPlay} className="control play-button">
          <i className={`fa fa-${media.playing ? 'pause' : 'play'}`} />
        </div>
      </div>
    );
  };

  renderVolumeControl = () => {
    const { videoEl } = this;
    const { media, SwitchMute } = this.props;
    const { muted } = media;
    const width = `${videoEl.volume * 100}%`;
    return (
      <div className="volume-control">
        <div onClick={SwitchMute} className="control volume-button">
          <i className={`fa fa-volume-${muted ? 'mute' : 'up'}`} />
        </div>
        <div className="progress-bar_container">
          <div className="progress-bar">
            <div style={{ width: muted ? 0 : width }} className="progress-bar_passed">
              <div className="scrubber_container">
                <div className="scrubber" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
}

class ProgressBar_ extends Player {
  constructor() {
    super();
    window.requestAnimationFrame =
      window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(f) {
        return setTimeout(f, 1000 / 60);
      };
    window.cancelAnimationFrame =
      window.cancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      function(requestID) {
        clearTimeout(requestID);
      };
  }

  state = {
    transform: '0%',
  };

  componentDidMount = () => {
    const { player, setUpdater } = this.props;
    setUpdater(this.updatePosition);
    this.updatePosition();
  };

  updatePosition = () => {
    const { media, player, playing } = this.props;
    const { duration } = media;

    const currentTime = player.getCurrentTime();
    const transform = `translateX(${(currentTime / duration) * 100}%)`;
    this.setState({ transform });
    this.animRef = window.requestAnimationFrame(this.updatePosition);
  };

  render() {
    const { transform } = this.state;
    return (
      <React.Fragment>
        <div
          style={{ transform }}
          ref={ref => (this.progress = ref)}
          className="progress-bar_passed"
        >
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
  playing: state.Media.playing,
});

const mapDispatchToProps = {
  UpdatePlayer: payload => ({ type: types.UPDATE_MEDIA, payload }),
  UpdateMediaURL: payload => ({ type: types.UPDATE_MEDIA_URL, payload }),
  SwitchPlay: () => ({ type: types.SWITCH_PLAY }),
  SwitchMute: () => ({ type: types.SWITCH_MUTE }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Player);

const ProgressBar = connect(mapStateToProps)(ProgressBar_);

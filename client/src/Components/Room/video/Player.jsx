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

  render() {
    return (
      <React.Fragment>
        {this.renderPlayer()}
        {this.player && this.renderPlayerGUI()}
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
        progressInterval={150}
        onProgress={this.handlePlaying}
        controls
        muted
        loop
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
    const { media, SwitchPlay } = this.props;
    const { progress } = this.state;
    return (
      <div className="video-player">
        <div className="progress-bar_container">
          <div className="progress-bar">
            <ProgressBar player={this.player} progress={progress} />
          </div>
        </div>
        <div className="video-time_container">
          <div className="current-time">{formatTime(media.currentTime)}</div>
          <div className="duration">{formatTime(media.duration)}</div>
        </div>
        <div className="play-button">
          <i onClick={() => SwitchPlay()} className="fa fa-pause" />
        </div>
        <div className="video-player_overflow" />
      </div>
    );
  };
}

class ProgressBar_ extends Player {
  constructor() {
    super();
    this.animRef = null;
    // this.throttled = window.requestAnimationFrame(this.updatePosition);
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
      }; // fall back
    this.startTime = Date.now();
  }

  state = {
    width: 0,
  };

  // shouldComponentUpdate(nextProps, nextState) {
  //   const { width } = this.state;
  //   if (nextState.width !== width) return true;
  //   return false;
  // }

  // componentDidMount = () => {
  //   this.updatePosition();
  // };

  // componentWillUnmount = () => {
  //   window.cancelAnimationFrame(this.animRef);
  // };

  // componentDidUpdate(prevProps, prevState) {
  //   const { playing } = this.props;
  //   if (!prevProps.playing && playing) this.updatePosition();
  //   if (prevProps.playing && !playing) window.cancelAnimationFrame(this.req);
  // }

  updatePosition = () => {
    const { media, player } = this.props;
    const { duration } = media;

    const currentTime = player.getCurrentTime();
    const width = (currentTime / duration) * 100;
    this.setState({ width });

    this.animRef = window.requestAnimationFrame(this.updatePosition);
  };

  render() {
    // let { width } = this.state;
    let { progress: width } = this.props;
    width *= 100;
    width += '%';
    // console.log(width);
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
  playing: state.Media.playing,
});

const mapDispatchToProps = {
  UpdatePlayer: payload => ({ type: types.UPDATE_MEDIA, payload }),
  UpdateMediaURL: payload => ({ type: types.UPDATE_MEDIA_URL, payload }),
  SwitchPlay: () => ({ type: types.SWITCH_PLAY }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Player);

const ProgressBar = connect(mapStateToProps)(ProgressBar_);

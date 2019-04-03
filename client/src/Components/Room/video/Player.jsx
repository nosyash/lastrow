import React, { Component } from 'react';
import { connect } from 'react-redux';
import ReactPlayer from 'react-player';
import { parse, stringify, stringifyVtt, resync, toMS, toSrtTime, toVttTime } from 'subtitle';
import * as types from '../../../constants/ActionTypes';
import { formatTime } from '../../../utils/base';
import { SEEK_SEL, VOLUME_SEL } from '../../../constants';
import http from '../../../utils/httpServices';

class Player extends Component {
  constructor() {
    super();
    this.videoEl = null;
    this.player = null;
    this.animRef = null;
    this.volume = null;
    this.seek = null;
  }

  state = { moving: false };

  componentDidMount() {
    document.addEventListener('mousedown', this.handleGlobalDown);
    document.addEventListener('mousemove', this.handleGlobalMove);
    document.addEventListener('mouseup', this.handleGlobalUp);

    this.handleSubs();
  }

  handleSubs = async () => {
    const { media, UpdateSubs } = this.props;
    if (!media || !media.subs.url) return;
    const res = await http.get(media.subs.url).catch(error => {
      if (error.response) console.log(error.response.status);
      else if (error.request) console.log(error.request);
      else console.log('Error', error.message);
    });

    if (!res) return;

    const { data } = res;
    UpdateSubs({ srt: parse(data) });
  };

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleGlobalDown);
    document.removeEventListener('mousemove', this.handleGlobalMove);
    document.removeEventListener('mouseup', this.handleGlobalUp);
  }

  handleGlobalDown = e => {
    const { moving } = this.state;
    const { SetVolume } = this.props;
    let { target } = e;

    if (moving) return;
    if (!this.player) return;

    if (target.closest(SEEK_SEL) || target.closest(VOLUME_SEL)) {
      this.setState({ moving: true });
      target = target.closest(SEEK_SEL) || target.closest(VOLUME_SEL);
      const { left, width } = target.getBoundingClientRect();
      const offset = e.clientX - left;
      let mult = offset / width;
      if (mult < 0) mult = 0;
      if (mult > 1) mult = 1;
      if (target.closest(VOLUME_SEL)) SetVolume(mult);
      if (target.closest(SEEK_SEL)) this.player.seekTo(mult);
    }
  };

  handleGlobalMove = e => {
    const { moving } = this.state;
    if (!moving) return;
    const { left, width } = this.seek.getBoundingClientRect();
    const offset = e.clientX - left;
    const mult = offset / width;
    this.player.seekTo(mult);
  };

  handleGlobalUp = () => {
    this.setState({ moving: false });
  };

  handleReady = () => this.updateTime();

  updateTime = () => {
    const { UpdatePlayer } = this.props;

    this.videoEl = this.player.getInternalPlayer();
    const duration = this.player.getDuration();
    const currentTime = this.player.getCurrentTime();

    UpdatePlayer({ duration, currentTime });
  };

  handlePlaying = progress => {
    const { UpdatePlayer } = this.props;
    const { playedSeconds } = progress;

    UpdatePlayer({ currentTime: playedSeconds });
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
        height=""
        autoPlay={false}
        progressInterval={850}
        onProgress={this.handlePlaying}
        controls={false}
        muted={media.muted}
        loop={false}
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
      <RenderSubs videoEl={this.videoEl} />
      <div className="video-player_overflow" />
    </div>
  );

  renderVideoTop = () => {
    const { media } = this.props;
    return (
      <div className="video-player_top">
        <div className="video-time current-time">{formatTime(media.currentTime)}</div>
        <ProgressBar
          animReef={this.animRef}
          player={this.player}
          seek={ref => (this.seek = ref)}
        />
        <div className="video-time duration">{formatTime(media.duration)}</div>
      </div>
    );
  };

  renderVideoMid = () => {
    const { media, SwitchPlay, cinemaMode } = this.props;
    const { ToggleCinemaMode } = this.props;
    return (
      <div className="video-player_mid">
        {this.renderVolumeControl()}
        <div onClick={SwitchPlay} className="control play-button">
          <i className={`fa fa-${media.playing ? 'pause' : 'play'}`} />
        </div>
        <div onClick={ToggleCinemaMode} className="control toggle-cinemamode">
          {!cinemaMode && <i className="fas fa-expand" />}
          {cinemaMode && <i className="fas fa-compress" />}
        </div>
      </div>
    );
  };

  renderVolumeControl = () => {
    const { videoEl } = this;
    const { media, SwitchMute } = this.props;
    const { muted } = media;
    let transform = `translateX(-${100 - videoEl.volume * 100}%)`;
    transform = muted ? 0 : transform;
    return (
      <div className="volume-control">
        <div onClick={SwitchMute} className="control volume-button">
          <i className={`fa fa-volume-${muted ? 'mute' : 'up'}`} />
        </div>
        <div
          ref={ref => (this.volume = ref)}
          className="progress-bar_container volume_trigger"
        >
          <div style={{ transform }} className="scrubber_container">
            <div className="scrubber" />
          </div>
          <div className="progress-bar">
            <div style={{ transform }} className="progress-bar_passed" />
          </div>
        </div>
      </div>
    );
  };
}

class RenderSubs_ extends Player {
  componentDidMount() {
    this.formatSubs();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { subs } = this.props;

    if (nextProps.subs.text !== subs.text) return true;
    return false;
  }

  formatSubs = () => {
    const { subs, videoEl } = this.props;
    const { UpdateSubs } = this.props;

    if (!subs.srt) return setTimeout(this.formatSubs, 50);

    const { currentTime } = videoEl;
    const ms = currentTime * 1000 + 100;
    const currentText = subs.text;
    const subObj = subs.srt.find(s => s.start <= ms && ms <= s.end);

    if (!subObj) {
      if (currentText !== '') UpdateSubs({ text: '' });
      return setTimeout(this.formatSubs, 50);
    }

    const text = subObj.text.replace(/\n/gm, ' ').replace(/^<.*>(.*)<\/.*>$/, '$1');
    if (currentText !== text) UpdateSubs({ text });

    setTimeout(this.formatSubs, 50);
  };

  render() {
    const { subs } = this.props;
    const { text } = subs;
    if (!text) return null;
    return <div className="subs-container">{this.renderLine(text)}</div>;
  }

  renderLine = text => <div className="subs">{text}</div>;
}

class ProgressBar_ extends Player {
  constructor() {
    super();
    window.requestAnimationFrame =
      window.webkitRequestAnimationFrame ||
      window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
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
    transform: 'translateX(-100%)',
  };

  componentDidMount = () => {
    this.updatePosition();
  };

  componentWillUnmount() {
    window.cancelAnimationFrame(this.animRef);
  }

  updatePosition = () => {
    const { media, player, playing } = this.props;
    const { duration } = media;

    const currentTime = player.getCurrentTime();
    const transform = `translateX(-${100 - (currentTime / duration) * 100}%)`;
    this.setState({ transform });
    this.animRef = window.requestAnimationFrame(this.updatePosition);
  };

  render() {
    const { transform } = this.state;
    return (
      <React.Fragment>
        <div ref={ref => this.props.seek(ref)} className="progress-bar_container seek_trigger">
          <div style={{ transform }} className="scrubber_container">
            <div className="scrubber" />
          </div>
          <div className="progress-bar">
            <div
              style={{ transform }}
              ref={ref => (this.progress = ref)}
              className="progress-bar_passed"
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => ({
  media: state.Media,
  subs: state.Media.subs,
  playing: state.Media.playing,
  MainStates: state.MainStates,
  cinemaMode: state.MainStates.cinemaMode,
});

const mapDispatchToProps = {
  UpdatePlayer: payload => ({ type: types.UPDATE_MEDIA, payload }),
  UpdateMediaURL: payload => ({ type: types.UPDATE_MEDIA_URL, payload }),
  SwitchPlay: () => ({ type: types.SWITCH_PLAY }),
  SwitchMute: () => ({ type: types.SWITCH_MUTE }),
  SetVolume: payload => ({ type: types.SET_VOLUME, payload }),
  ToggleCinemaMode: () => ({ type: types.TOGGLE_CINEMAMODE }),
  UpdateSubs: payload => ({ type: types.UPDATE_SUBS, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Player);

const ProgressBar = connect(mapStateToProps)(ProgressBar_);

const RenderSubs = connect(
  mapStateToProps,
  mapDispatchToProps
)(RenderSubs_);

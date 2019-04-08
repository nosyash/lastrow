import React, { Component } from 'react';
import { connect } from 'react-redux';
import ReactPlayer from 'react-player';
import { parse } from 'subtitle';
import * as types from '../../../constants/ActionTypes';
import { formatTime } from '../../../utils/base';
import { SEEK_SEL, VOLUME_SEL, playerConf } from '../../../constants';
import http from '../../../utils/httpServices';
import ProgressBar from './ProgressBar';
import Subtitles from './Subtitles';

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
    const { media, updateSubs } = this.props;
    if (!media || !media.subs.url) return;
    const res = await http.get(media.subs.url).catch(error => {
      if (error.response) console.log(error.response.status);
      else if (error.request) console.log(error.request);
      else console.log('Error', error.message);
    });

    if (!res) return;

    const { data } = res;
    updateSubs({ srt: parse(data) });
  };

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleGlobalDown);
    document.removeEventListener('mousemove', this.handleGlobalMove);
    document.removeEventListener('mouseup', this.handleGlobalUp);
  }

  handleGlobalDown = e => {
    const { moving } = this.state;
    const { setVolume } = this.props;
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
      if (target.closest(VOLUME_SEL)) setVolume(mult);
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
    const { updatePlayer } = this.props;

    this.videoEl = this.player.getInternalPlayer();
    const duration = this.player.getDuration();
    const currentTime = this.player.getCurrentTime();

    updatePlayer({ duration, currentTime });
  };

  handlePlaying = progress => {
    const { updatePlayer } = this.props;
    const { playedSeconds } = progress;

    updatePlayer({ currentTime: playedSeconds });
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
        progressInterval={800}
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
        config={playerConf}
      />
    );
  };

  renderPlayerGUI = () => (
    <div className="video-player">
      {this.renderVideoTop()}
      {this.renderVideoMid()}
      <Subtitles videoEl={this.videoEl} />
      <div className="video-player_overflow" />
    </div>
  );

  renderVideoTop = () => {
    const { media } = this.props;
    return (
      <div className="video-player_top">
        <div className="video-time current-time">
          {formatTime(media.currentTime)}
        </div>
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
    const { media, switchPlay, cinemaMode } = this.props;
    const { toggleCinemaMode } = this.props;
    return (
      <div className="video-player_mid">
        {this.renderVolumeControl()}
        <div onClick={switchPlay} className="control play-button">
          <i className={`fa fa-${media.playing ? 'pause' : 'play'}`} />
        </div>
        <div onClick={toggleCinemaMode} className="control toggle-cinemamode">
          {!cinemaMode && <i className="fas fa-expand" />}
          {cinemaMode && <i className="fas fa-compress" />}
        </div>
      </div>
    );
  };

  renderVolumeControl = () => {
    const { videoEl } = this;
    const { media, switchMute } = this.props;
    const { muted } = media;
    let transform = `translateX(-${100 - videoEl.volume * 100}%)`;
    transform = muted ? 0 : transform;
    return (
      <div className="volume-control">
        <div onClick={switchMute} className="control volume-button">
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

const mapStateToProps = state => ({
  media: state.Media,
  subs: state.Media.subs,
  playing: state.Media.playing,
  cinemaMode: state.MainStates.cinemaMode,
});

const mapDispatchToProps = {
  updatePlayer: payload => ({ type: types.UPDATE_MEDIA, payload }),
  switchPlay: () => ({ type: types.SWITCH_PLAY }),
  switchMute: () => ({ type: types.SWITCH_MUTE }),
  setVolume: payload => ({ type: types.SET_VOLUME, payload }),
  toggleCinemaMode: () => ({ type: types.TOGGLE_CINEMAMODE }),
  updateSubs: payload => ({ type: types.UPDATE_SUBS, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Player);

import React, { useState, useContext, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import ReactPlayer from 'react-player';
import { parse } from 'subtitle';
import * as types from '../../../constants/ActionTypes';
import { formatTime } from '../../../utils/base';
import {
  SEEK_SEL,
  VOLUME_SEL,
  playerConf,
  VIDEO_ELEMENT_SEL,
  PLAYER_MINIMIZE_TIMEOUT,
  VOLUME_WHEEL,
} from '../../../constants';
import http from '../../../utils/httpServices';
import ProgressBar from './ProgressBar';
import Subtitles from './Subtitles';
import { fetchSubs } from '../../../actions';

let minimizeTimer = null;
let videoEl = null;
let seekEl = null;
const wasPlaying = false;
function Player(props) {
  const [moving, setMoving] = useState(false);
  const [changingVolume, setChangingVolume] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const playerRef = useRef(null);

  let volume = 0.3;

  useEffect(() => {
    addEvents();
    init();

    return () => {
      removeEvents();
      resetRefs();
      props.resetMedia();
    };
  }, []);

  function resetRefs() {
    videoEl = null;
    seekEl = null;
  }

  function addEvents() {
    // document.addEventListener('mousedown', handleGlobalDown);
    // document.addEventListener('mousemove', handleGlobalMove);
    // document.addEventListener('mouseup', handleGlobalUp);
  }

  function removeEvents() {
    // document.removeEventListener('mousedown', handleGlobalDown);
    // document.removeEventListener('mousemove', handleGlobalMove);
    // document.removeEventListener('mouseup', handleGlobalUp);
  }

  function init() {
    const { updatePlayer } = props;
    // eslint-disable-next-line prefer-destructuring
    volume = localStorage.volume;
    volume = JSON.parse(volume || 1);
    updatePlayer({ volume });
    handleSubs();
  }

  async function handleSubs() {
    const { media, updateSubs } = props;
    if (!media || !media.subs.url) return;
    props.getSubs(media.subs.url);
    // const res = await http.get(media.subs.url).catch(error => {
    //   if (error.response) {
    //     console.log(error.response.status);
    //   } else if (error.request) {
    //     console.log(error.request);
    //   } else {
    //     console.log('Error', error.message);
    //   }
    // });

    // if (!res) {
    //   return;
    // }

    // const { data } = res;
    // updateSubs({ srt: parse(data) });
  }

  function handlePlayerMove(e) {
    let { target } = e;

    // Firefox returns "document" object as target in some cases,
    // which causes an error on target.closest()
    if (!target) return;
    if (target === document) return;

    target = target.closest(VIDEO_ELEMENT_SEL);
    clearTimeout(minimizeTimer);
    if (minimized) {
      setMinimized(false);
    }
  }

  function handleReady() {
    updateTime();
    // handleMinimizeTimer();
  }

  function updateTime() {
    const { updatePlayer } = props;
    if (!playerRef) return;
    videoEl = playerRef.current.getInternalPlayer();
    const duration = playerRef.current.getDuration();
    const currentTime = playerRef.current.getCurrentTime();
    updatePlayer({ duration, currentTime });
  }

  function handlePlaying(progress) {
    const { updatePlayer } = props;
    const { playedSeconds } = progress;
    updatePlayer({ currentTime: playedSeconds });
    // handleMinimizeTimer();
  }

  function handleMinimizeTimer() {
    if (minimized) {
      clearTimeout(minimizeTimer);
    } else {
      minimizeTimer = setTimeout(() => {
        console.log('minimized');
        setMinimized(true);
      }, PLAYER_MINIMIZE_TIMEOUT);
    }
  }

  const handlePlay = () => {
    const e = new Event('videoplay');
    document.dispatchEvent(e);
  };

  const handlePause = () => {
    const e = new Event('videopause');
    document.dispatchEvent(e);
  };

  function renderPlayer() {
    const { media } = props;
    return (
      <React.Fragment>
        <ReactPlayer
          ref={playerRef}
          className="player-inner"
          width="100%"
          height=""
          onPlay={handlePlay}
          onPause={handlePause}
          config={playerConf}
          autoPlay={false}
          controls={false}
          loop={false}
          progressInterval={400}
          muted={media.muted}
          playing={media.playing}
          volume={media.volume}
          url={media.url}
          onProgress={handlePlaying}
          // onPlay={handlePlay}
          // onPause={handlePause}
          onReady={handleReady}
        />
        <div className="video-overlay" />
      </React.Fragment>
    );
  }

  function renderPlayerGUI() {
    return (
      <div className="video-player">
        {renderVideoTop()}
        {renderVideoMid()}
        {videoEl && <Subtitles videoEl={videoEl} />}
        <div className="video-player_overflow" />
      </div>
    );
  }

  function handleProgressChange(percent) {
    console.log(props.media);
    playerRef.current.seekTo(percent / 100, 'fraction');
  }

  function renderVideoTop() {
    const { media } = props;
    const currentTime = playerRef.current.getCurrentTime();
    const progressValue = (currentTime / media.duration) * 100;
    return (
      <div className="video-player_top">
        <div className="video-time current-time">{formatTime(media.currentTime)}</div>
        <ProgressBar onProgressChange={handleProgressChange} value={progressValue} />
        <div className="video-time duration">{formatTime(media.duration)}</div>
      </div>
    );
  }

  function renderVideoMid() {
    const { media, switchPlay, cinemaMode } = props;
    const { toggleCinemaMode } = props;
    return (
      <div className="video-player_mid">
        {renderVolumeControl()}
        <div onClick={switchPlay} className="control play-button">
          <i className={`fa fa-${media.playing ? 'pause' : 'play'}`} />
        </div>
        <div onClick={toggleCinemaMode} className="control toggle-cinemamode">
          {!cinemaMode && <i className="fas fa-expand" />}
          {cinemaMode && <i className="fas fa-compress" />}
        </div>
      </div>
    );
  }

  function handleVolumeChange(percent) {
    props.setVolume(percent / 100);
  }

  function renderVolumeControl() {
    const { switchMute } = props;
    const { muted, volume } = props.media;
    return (
      <React.Fragment>
        <div onClick={switchMute} className="control volume-button">
          <i className={`fa fa-volume-${muted ? 'mute' : 'up'}`} />
        </div>
        <ProgressBar
          wheel
          onWheelClick={switchMute}
          classes={`volume-control ${muted ? 'volume-control_muted' : ''}`}
          onProgressChange={handleVolumeChange}
          value={muted ? 0 : volume * 100}
        />
      </React.Fragment>
      // <div onWheel={handleWheel} className="volume-control">
      // <div onClick={switchMute} className="control volume-button">
      //   <i className={`fa fa-volume-${muted ? 'mute' : 'up'}`} />
      // </div>
      // <div
      //     // ref={ref => (volume = ref)}
      //     className="progress-bar_container volume_trigger"
      //   >
      //     <div style={{ transform }} className="scrubber_container">
      //       <div className="scrubber" />
      //     </div>
      //     <div className="progress-bar">
      //       <div style={{ transform }} className="progress-bar_passed" />
      //     </div>
      //   </div>
      // </div>
    );
  }

  const classes = `video-element ${minimized ? 'player-minimized' : 'player-maximized'}`;
  return (
    <React.Fragment>
      <div onMouseEnter={() => setMinimized(false)} className={classes}>
        {renderPlayer()}
        {playerRef.current && renderPlayerGUI()}
      </div>
    </React.Fragment>
  );
}

const mapStateToProps = state => ({
  media: state.Media,
  subs: state.Media.subs,
  playing: state.Media.playing,
  cinemaMode: state.MainStates.cinemaMode,
});

const mapDispatchToProps = {
  updatePlayer: payload => ({ type: types.UPDATE_MEDIA, payload }),
  resetMedia: () => ({ type: types.RESET_MEDIA }),
  switchPlay: () => ({ type: types.SWITCH_PLAY }),
  switchMute: () => ({ type: types.SWITCH_MUTE }),
  setVolume: payload => ({ type: types.SET_VOLUME, payload }),
  toggleCinemaMode: () => ({ type: types.TOGGLE_CINEMAMODE }),
  updateSubs: payload => ({ type: types.SET_SUBS, payload }),
  getSubs: payload => fetchSubs(payload),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Player);

// export default Player;
// export default createConsumer(Player);

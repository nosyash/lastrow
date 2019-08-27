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
function Player(props) {
  const [moving, setMoving] = useState(false);
  const [changingVolume, setChangingVolume] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const playerRef = useRef(null);

  let seek = null;
  let wasPlaying = false;
  let volume = null;

  useEffect(() => {
    addEvents();
    init();

    return () => {
      removeEvents();
      videoEl = null;
      props.resetMedia();
    };
  }, []);

  function addEvents() {
    document.addEventListener('mousedown', handleGlobalDown);
    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalUp);
  }

  function removeEvents() {
    document.removeEventListener('mousedown', handleGlobalDown);
    document.removeEventListener('mousemove', handleGlobalMove);
    document.removeEventListener('mouseup', handleGlobalUp);
  }

  function init() {
    const { updatePlayer } = props;
    // eslint-disable-next-line prefer-destructuring
    volume = localStorage.volume;
    volume = JSON.parse(volume || 1);
    updatePlayer({ volume });
    handleSubs()
  }

  async function handleSubs() {
    const { media, updateSubs } = props;
    if (!media || !media.subs.url) return;
    console.log(updateSubs);
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

  function handleGlobalDown(e) {
    const { setVolume, updatePlayer, switchMute } = props;
    const { media } = props;
    let { target } = e;

    if (moving) return;
    if (!playerRef) return;

    // TODO: This has to be completely reworked
    if (target.closest(SEEK_SEL) || target.closest(VOLUME_SEL)) {
      const isChangingVolume = target.closest(VOLUME_SEL);
      if (media.playing && !isChangingVolume) {
        updatePlayer({ playing: false });
        wasPlaying = true;
      }
      if (isChangingVolume) setChangingVolume(true);
      else setMoving(true);
      target = target.closest(SEEK_SEL) || target.closest(VOLUME_SEL);
      const { left, width } = target.getBoundingClientRect();
      const offset = e.clientX - left;
      let mult = offset / width;
      mult = Math.max(0, Math.min(1, mult));
      if (isChangingVolume) {
        setVolume(mult);
        if (media.muted) {
          switchMute();
        }
      } else playerRef.current.seekTo(mult);
    }
  }

  function handleGlobalMove(e) {
    handlePlayerMove(e);
    const { setVolume } = props;
    if (!moving && !changingVolume) return;
    const target = changingVolume ? volume : seek;
    const { left, width } = target.getBoundingClientRect();
    const offset = e.clientX - left;
    let mult = offset / width;
    mult = Math.min(1, mult);
    mult = Math.max(0, mult);
    if (changingVolume) setVolume(mult);
    else playerRef.current.seekTo(mult);
  }

  function handleGlobalUp() {
    const { updatePlayer, media } = props;

    if (!moving && !changingVolume) return;
    if (changingVolume) {
      localStorage.volume = media.volume;
      setChangingVolume(false);
    } else {
      setMoving(false);
      if (wasPlaying) updatePlayer({ playing: true });
      wasPlaying = false;
    }
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

  function renderPlayer() {
    const { media } = props;
    return (
      <React.Fragment>
        <ReactPlayer
          ref={playerRef}
          className="player-inner"
          width="100%"
          height=""
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

  function renderVideoTop() {
    const { media } = props;
    return (
      <div className="video-player_top">
        <div className="video-time current-time">{formatTime(media.currentTime)}</div>
        <ProgressBar player={playerRef.current} seek={ref => (seek = ref)} />
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

  function renderVolumeControl() {
    const { media, switchMute } = props;
    const { muted, volume } = media;
    const transformValue = 100 - volume * 100;
    const transform = `translateX(-${muted ? 100 : transformValue}%)`;
    return (
      <div onWheel={handleWheel} className="volume-control">
        <div onClick={switchMute} className="control volume-button">
          <i className={`fa fa-volume-${muted ? 'mute' : 'up'}`} />
        </div>
        <div
          // ref={ref => (volume = ref)}
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
  }

  function handleWheel(e) {
    const { setVolume, switchMute, media } = props;
    const { volume: currentVolume, muted } = media;
    const delta = e.deltaY < 0 ? 1 : -1;

    let volumeNew = currentVolume + VOLUME_WHEEL * delta;
    volumeNew = Math.max(0, Math.min(1, volumeNew));

    if (muted) {
      return switchMute();
    }

    if (currentVolume !== volumeNew) {
      setVolume(volumeNew);
    }
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

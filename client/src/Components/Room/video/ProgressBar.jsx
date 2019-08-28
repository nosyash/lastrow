import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';

let animRef = null;

let duration = 0;
function ProgressBar({ media, player, seekEl }) {
  const [transform, setStransform] = useState('translateX(-100%)');
  duration = media.duration;
  useEffect(() => {
    updatePosition();

    return () => {
      cancelAnimationFrame(animRef);
      animRef = null;
    };
  }, []);

  useEffect(() => {
    removeEvents();
    addEvents();
  }, [transform]);

  function addEvents() {
    document.addEventListener('videoplay', onPlay);
    document.addEventListener('videopause', onPause);
  }
  function removeEvents() {
    document.removeEventListener('videoplay', onPlay);
    document.removeEventListener('videopause', onPause);
  }

  function onPlay() {
    // cancelAnimationFrame(animRef);
    // updatePosition();
  }

  function onPause() {
    // cancelAnimationFrame(animRef);
  }

  function updatePosition() {
    const currentTime = player.getCurrentTime();
    const percentage = -(100 - (currentTime / duration) * 100);
    setStransform(`translateX(${percentage}%)`);
    animRef = requestAnimationFrame(updatePosition);
  }

  return (
    <div ref={ref => seekEl(ref)} className="progress-bar_container seek_trigger">
      <div style={{ transform }} className="scrubber_container">
        <div className="scrubber" />
      </div>
      <div className="progress-bar">
        <div style={{ transform }} className="progress-bar_passed" />
      </div>
    </div>
  );
}

const mapStateToProps = state => ({
  media: state.Media,
  subs: state.Media.subs,
  playing: state.Media.playing,
  MainStates: state.MainStates,
  cinemaMode: state.MainStates.cinemaMode,
});

export default connect(mapStateToProps)(ProgressBar);

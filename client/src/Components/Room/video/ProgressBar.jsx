import React, { Component, useState, useEffect } from 'react';
import { connect } from 'react-redux';

let animRef = null;

function ProgressBar({ media, player, seekEl }) {
  const [transform, setStransform] = useState('translateX(-100%)')

  useEffect(() => {
    updatePosition();

    return () => {
      window.cancelAnimationFrame(animRef);
      animRef = null;
    }
  }, [])

  function updatePosition() {
    const { duration } = media;

    const currentTime = player.getCurrentTime();
    const percentage = -(100 - (currentTime / duration) * 100);
    const transform = `translateX(${percentage}%)`;
    setStransform(transform)
    animRef = window.requestAnimationFrame(updatePosition);
  };

  return (
    <div
      ref={ref => seekEl(ref)}
      className="progress-bar_container seek_trigger"
    >
      <div style={{ transform }} className="scrubber_container">
        <div className="scrubber" />
      </div>
      <div className="progress-bar">
        <div
          style={{ transform }}
          className="progress-bar_passed"
        />
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

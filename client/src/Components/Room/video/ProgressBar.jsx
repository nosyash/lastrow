import React, { Component, useState, useEffect } from 'react';
import { connect } from 'react-redux';

let animRef = null;

function ProgressBar(props) {
  const [transform, setStransform] = useState('translateX(-100%)')

  useEffect(() => {
    updatePosition();

    return () => {
      window.cancelAnimationFrame(animRef);
    }
  }, [])

  function updatePosition() {
    const { media, player } = props;
    const { duration } = media;

    const currentTime = player.getCurrentTime();
    const percentage = -(100 - (currentTime / duration) * 100);
    const transform = `translateX(${percentage}%)`;
    setStransform(transform)
    animRef = window.requestAnimationFrame(this.updatePosition);
  };
  const { seek } = props;
  return (
    <React.Fragment>
      <div
        ref={ref => seek(ref)}
        className="progress-bar_container seek_trigger"
      >
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

const mapStateToProps = state => ({
  media: state.Media,
  subs: state.Media.subs,
  playing: state.Media.playing,
  MainStates: state.MainStates,
  cinemaMode: state.MainStates.cinemaMode,
});

export default connect(mapStateToProps)(ProgressBar);

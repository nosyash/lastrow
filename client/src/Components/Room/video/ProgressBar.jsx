import React, { Component } from 'react';
import { connect } from 'react-redux';

class ProgressBar extends Component {
  constructor() {
    super();
    window.requestAnimationFrame =
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
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
    const { media, player } = this.props;
    const { duration } = media;

    const currentTime = player.getCurrentTime();
    const transform = `translateX(-${100 - (currentTime / duration) * 100}%)`;
    this.setState({ transform });
    this.animRef = window.requestAnimationFrame(this.updatePosition);
  };

  render() {
    const { seek } = this.props;
    const { transform } = this.state;
    return (
      <React.Fragment>
        <div ref={ref => seek(ref)} className="progress-bar_container seek_trigger">
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

export default connect(mapStateToProps)(ProgressBar);

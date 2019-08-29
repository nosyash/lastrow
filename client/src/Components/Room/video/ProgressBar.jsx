import React, { Component, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { throttle } from 'lodash';
import { SEEK_SEL } from '../../../constants';

const animRef = null;

const duration = 0;
class ProgressBar extends Component {
  constructor() {
    super();
    this.state = {
      moving: false,
    };
    this.clientY = 0;
    this.progressContainerEl = React.createRef();
    this.progressEl = React.createRef();

    this.mouseMove = throttle(this.handleGlobalMove, 32);
  }

  componentDidMount() {
    this.addEvents();
  }

  componentWillUnmount() {
    this.removeEvents();
  }

  addEvents = () => {
    // document.addEventListener('mousedown', this.handleGlobalDown);
    document.addEventListener('mousemove', this.mouseMove);
    document.addEventListener('mouseup', this.handleGlobalUp);
  };

  removeEvents = () => {
    // document.removeEventListener('mousedown', this.handleGlobalDown);
    document.removeEventListener('mousemove', this.mouseMove);
    document.removeEventListener('mouseup', this.handleGlobalUp);
  };

  toFixed = value => parseFloat(value.toFixed(4));

  handleWheelClick = () => {
    const { onWheelClick } = this.props;
    if (onWheelClick) onWheelClick();
  };

  handleGlobalDown = e => {
    const { clientX, target, which } = e;

    // 0 is Left Mouse Button
    console.log(e.button);
    if (e.button === 1) this.handleWheelClick();
    if (e.button) return;

    const element = target.closest(SEEK_SEL);
    if (element.isEqualNode(this.progressEl.current)) return;
    if (!element) return;
    this.setState({ moving: true });

    this.clientX = clientX;
    const percentage = this.getPercentageOfProgress({ clientX });
    const percentageFixed = this.toFixed(percentage);

    const { onProgressChange } = this.props;
    onProgressChange(percentageFixed);
  };

  isPercentageChanged = percentage => {
    if (this.props.value !== percentage) return true;
  };

  getPercentageOfProgress = ({ clientX }) => {
    const { progressLeft, progressWidth } = this.getProgressCoordinates();
    return this.formatPercentage({ clientX, progressLeft, progressWidth });
  };

  formatPercentage = ({ clientX, progressLeft, progressWidth }) => {
    const position = ((clientX - progressLeft) / progressWidth) * 100;
    return Math.max(0, Math.min(100, position));
  };

  getProgressCoordinates = () => {
    const {
      left: progressLeft,
      width: progressWidth,
    } = this.progressEl.current.getBoundingClientRect();
    return { progressLeft, progressWidth };
  };

  handleGlobalMove = e => {
    if (!this.state.moving) return;
    const { clientX } = e;
    const percentage = this.getPercentageOfProgress({ clientX });
    const percentageFixed = this.toFixed(percentage);
    const { onProgressChange } = this.props;
    onProgressChange(percentageFixed);
  };

  handleGlobalUp = () => {
    if (this.state.moving) {
      this.setState({ moving: false });
    }
  };
  // const [transform, setStransform] = useState('translateX(-100%)');
  // duration = media.duration;
  // useEffect(() => {
  //   updatePosition();

  //   return () => {
  //     cancelAnimationFrame(animRef);
  //     animRef = null;
  //   };
  // }, []);

  // useEffect(() => {
  //   removeEvents();
  //   addEvents();
  // }, [transform]);

  // addEvents() {
  //   document.addEventListener('videoplay', onPlay);
  //   document.addEventListener('videopause', onPause);
  // }
  // removeEvents() {
  //   document.removeEventListener('videoplay', onPlay);
  //   document.removeEventListener('videopause', onPause);
  // }

  // onPlay() {
  // cancelAnimationFrame(animRef);
  // updatePosition();
  // }

  // onPause() {
  // cancelAnimationFrame(animRef);
  // }

  // updatePosition = () => {
  // const currentTime = player.getCurrentTime();
  // const percentage = -(100 - (currentTime / duration) * 100);
  // setStransform(`translateX(${percentage}%)`);
  // animRef = requestAnimationFrame(updatePosition);
  // };

  handleWheel = e => {
    const { wheel } = this.props;
    if (!wheel) return;

    const delta = e.deltaY < 0 ? 1 : -1;

    const { value } = this.props;
    const { onProgressChange } = this.props;

    const percentage = Math.max(0, Math.min(100, value + delta * 10));
    onProgressChange(percentage);
  };

  getTransformStyle() {
    const { value } = this.props;
    const isUndefined = value === undefined;
    return `translateX(-${isUndefined ? 100 : 100 - value}%)`;
  }

  render() {
    const { classes } = this.props;
    const transform = this.getTransformStyle();
    return (
      <div
        onWheel={this.handleWheel}
        ref={this.progressContainerEl}
        onMouseDown={this.handleGlobalDown}
        className={`progress-bar_container seek-trigger ${classes || ''}`}
      >
        <div style={{ transform }} className="scrubber_container">
          <div className="scrubber" />
        </div>
        <div ref={this.progressEl} className="progress-bar">
          <div style={{ transform }} className="progress-bar_passed" />
        </div>
      </div>
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

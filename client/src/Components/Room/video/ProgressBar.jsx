import React, { Component } from 'react';
import { connect } from 'react-redux';
import { throttle } from 'lodash';
import { SEEK_SEL } from '../../../constants';

class ProgressBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      moving: false,
      // progress: this.props.value,
    };
    this.clientY = 0;
    this.progressContainerEl = React.createRef();
    this.progressEl = React.createRef();

    this.seekTimer = null;

    this.mouseMove = throttle(this.handleGlobalMove, 5);
  }

  componentDidMount() {
    this.addEvents();
  }

  componentWillUnmount() {
    this.removeEvents();
  }

  addEvents = () => {
    document.addEventListener('mousemove', this.mouseMove);
    document.addEventListener('mouseup', this.handleGlobalUp);
  };

  removeEvents = () => {
    document.removeEventListener('mousemove', this.mouseMove);
    document.removeEventListener('mouseup', this.handleGlobalUp);
  };

  toFixed = value => parseFloat(value.toFixed(4));

  handleWheelClick = () => {
    const { onWheelClick } = this.props;
    if (onWheelClick) onWheelClick();
  };

  handleGlobalDown = e => {
    const { clientX, target } = e;

    if (e.button === 1) this.handleWheelClick();
    // 0 is Left Mouse Button
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
    // this.setState({ progress: percentageFixed });
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

    // clearTimeout(this.seekTimer);
    // this.setState({ progress: percentageFixed });
    // this.seekTimer = setTimeout(() => {
    onProgressChange(percentageFixed);
    // }, 16);
  };

  handleGlobalUp = () => {
    // this.setState({ progress: this.props.value });
    if (this.state.moving) {
      this.setState({ moving: false, progress: this.props.value });
    }
  };

  handleWheel = e => {
    const { wheel } = this.props;
    if (!wheel) return;

    const delta = e.deltaY < 0 ? 1 : -1;

    const { progress } = this.props;
    const { onProgressChange } = this.props;

    const percentage = Math.max(0, Math.min(100, progress + delta * 10));
    onProgressChange(percentage);
  };

  getTransformStyle() {
    const { value: curProgress } = this.props;
    // const { progress, moving } = this.state;
    // const curProgress = moving ? progress : value;
    const isUndefined = curProgress === undefined;
    return `translateX(-${isUndefined ? 100 : 100 - curProgress}%)`;
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

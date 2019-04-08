import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as types from '../../../constants/ActionTypes';

class SubtitlesContainer extends Component {
  componentDidMount() {
    this.formatSubs();
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  toStr = s => JSON.stringify(s);

  timer = null;

  shouldComponentUpdate(nextProps, nextState) {
    const { subs } = this.props;
    const a = this.toStr(nextProps.subs.text);
    const b = this.toStr(subs.text);
    if (a !== b) return true;
    return false;
  }

  formatSubs = () => {
    const { subs, videoEl } = this.props;
    const { updateSubs } = this.props;

    if (!subs.srt) return (this.timer = setTimeout(this.formatSubs, 80));

    const { currentTime } = videoEl;
    const ms = currentTime * 1000 + 100;
    const currentText = this.toStr(subs.text);

    const text = subs.srt.filter(s => s.start <= ms && ms <= s.end).reverse();

    if (this.toStr(text) === '') {
      if (currentText !== []) updateSubs({ text: [] });
      return (this.timer = setTimeout(this.formatSubs, 80));
    }

    text.forEach(el => {
      el.text = el.text.replace(/\n/gm, ' ').replace(/^<.*>(.*)<\/.*>$/, '$1');
    });

    if (currentText !== this.toStr(text)) updateSubs({ text });

    this.timer = setTimeout(this.formatSubs, 80);
  };

  render() {
    const { subs } = this.props;
    const { text } = subs;
    if (!text) {
      return null;
    }
    return <RenderSubs text={text} />;
  }
}

const RenderSubs = ({ text }) => {
  const minify = text.length > 3;
  const classes = `subs-container${minify ? ' subs-container_minified' : ''}`;
  return (
    <div className={classes}>
      {text.map((currentSub, index) => (
        <div key={index} className="sub-line">
          {currentSub.text}
        </div>
      ))}
    </div>
  );
};

const mapStateToProps = state => ({
  media: state.Media,
  subs: state.Media.subs,
});

const mapDispatchToProps = {
  updateSubs: payload => ({ type: types.UPDATE_SUBS, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SubtitlesContainer);

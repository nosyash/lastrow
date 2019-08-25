import React, { Component, useMemo, useEffect } from 'react';
import { connect } from 'react-redux';
import * as types from '../../../constants/ActionTypes';
import { getFirstOccurrences } from '../../../utils/base';

const newLineRegExp = new RegExp(/\n/, 'gm');
const bracketsRegExp = new RegExp(/^<.*>(.*)<\/.*>$/);
let timer = null;
function SubtitlesContainer(props) {
  useEffect(() => {
    setTimeout(formatSubs, 0);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const toStr = s => JSON.stringify(s);

  // shouldComponentUpdate(nextProps, nextState) {
  //   const { subs } = props;
  //   const a = toStr(nextProps.subs.text);
  //   const b = toStr(subs.text);
  //   if (a !== b) return true;
  //   return false;
  // }

  function formatSubs() {
    const { subs } = props;
    const { updateSubs } = props;

    if (!subs.srt) return (timer = setTimeout(formatSubs, 80));

    const currentText = toStr(subs.text);
    const newText = filterSubsByTime();

    if (!toStr(newText)) {
      if (currentText.length) {
        updateSubs({ text: [] });
      }
      timer = setTimeout(formatSubs, 80);
      return;
    }

    newText.forEach(el => {
      el.text = el.text.replace(newLineRegExp, ' ').replace(bracketsRegExp, '$1');
    });

    if (currentText !== toStr(newText)) updateSubs({ text: newText });

    timer = setTimeout(formatSubs, 80);
  }

  function filterSubsByTime() {
    const { subs, videoEl } = props;
    const ms = videoEl.currentTime * 1000;
    console.time('test');
    const newText = subs.srt.filter(s => s.start <= ms && ms <= s.end).reverse();
    // const newText = getFirstOccurrences(
    //   subs.srt,
    //   el => el.start <= ms && ms <= el.end
    // ).reverse();
    console.timeEnd('test');
    return newText;
  }

  const { text } = props.subs;
  return <RenderSubs text={text} />;
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
  updateSubs: payload => ({ type: types.SET_SUBS, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SubtitlesContainer);

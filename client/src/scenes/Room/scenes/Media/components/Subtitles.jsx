import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import * as types from '../../../../../constants/ActionTypes';
import SubtitlesHandler from '../../../../../utils/subtitles';

let timer = null;
let pauseTimer = null;
const subtitlesHandler = new SubtitlesHandler();

function SubtitlesContainer(props) {
    useEffect(() => {
        initSubs(() => {
            setTimeout(formatSubs, 0);
        });

        return () => {
            clearTimeout(timer);
        };
    }, []);

    function initSubs(callback) {
        const { subs } = props;

        if (!subs.srt) return;
        subtitlesHandler.setSubtitles(subs.srt);
        callback();
    }

    function formatSubs() {
        const { subs } = props;
        const { setCurrentSubs } = props;

        const currentText = subs.text;

        const { videoEl } = props;
        const timeMs = videoEl.currentTime * 1000;

        if (videoEl.paused) {
            pauseTimer = setTimeout(() => {
                subtitlesHandler.setCurrentTime(timeMs);
                subtitlesHandler.updateTempSubtitiles();
            }, 20);
            clearTimeout(pauseTimer);
        }
        const newText = subtitlesHandler.getSubtitles(timeMs);

        if (JSON.stringify(currentText) !== JSON.stringify(newText)) {
            setCurrentSubs(newText);
        }
        timer = setTimeout(formatSubs, 16);
    }

    const { text } = props.subs;
    return <RenderSubs text={text} />;
}

// eslint-disable-next-line react/display-name
const RenderSubs = React.memo(({ text }) => {
    return <RenderSub text={text} />;
});

const RenderSub = ({ text }) => {
    const minify = text.length > 3;
    const classes = `subs-container${minify ? ' subs-container_minified' : ''}`;
    return (
        <div className={classes}>
            {text.map(currentSub => (
                <div
                    key={currentSub.text + currentSub.end + currentSub.start}
                    className="sub-line"
                >
                    {currentSub.text}
                </div>
            ))}
        </div>
    );
};

const mapStateToProps = state => ({
    media: state.media,
    subs: state.media.subs,
});

const mapDispatchToProps = {
    updateSubs: payload => ({ type: types.SET_SUBS, payload }),
    setCurrentSubs: payload => ({ type: types.SET_CURRENT_SUBS, payload }),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SubtitlesContainer);

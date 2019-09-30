import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import * as types from '../../../../../constants/actionTypes';
import { Subtitles, Media, SubtitlesItem } from '../../../../../reducers/media';
import { workerRequest } from '../../../../../worker/index';


interface SubtitlesProps {
    media: Media;
    subs: Subtitles;
    showSubs: boolean;
    videoEl: HTMLVideoElement;
    updateSubs: (payload: any) => void;
    setCurrentSubs: (payload: any) => void;
}

let timer = null;
let pauseTimer = null;

function SubtitlesContainer(props: SubtitlesProps) {
    const videoEl = useRef<HTMLVideoElement>(null);
    // const subtitlesHandler = useRef<SubtitlesHandler>(null);
    useEffect(() => {
        initSubtitles();
        document.addEventListener('subtitlesready', initSubtitles);
        document.addEventListener('subtitlesdestroyed', clearTimers);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('subtitlesready', initSubtitles);
            document.removeEventListener('subtitlesdestroyed', clearTimers);
        };
    }, []);

    function clearTimers() {
        clearInterval(timer)
    }

    function initSubtitles() {
        videoEl.current = document.querySelector('.player-inner video');
        watchAndChangeTime()
    }

    function watchAndChangeTime() {
        clearInterval(timer)
        timer = setInterval(() => {
            if (!videoEl.current) clearInterval(timer)
            workerRequest.subtitlesSetTime(videoEl.current.currentTime)
        }, 32)
    }

    function formatSubs() {
        // const { subs, showSubs } = props;
        // const { setCurrentSubs } = props;

        // if (!showSubs) return;
        // if (!videoEl.current) return;

        // const prevCurrentSubtitles = subs.raw;
        // const timeMs = videoEl.current.currentTime * 1000;
        // if (videoEl.current.paused) {
        //     pauseTimer = setTimeout(() => {
        //         subtitlesHandler.current.setCurrentTime(timeMs);
        //         subtitlesHandler.current.forceUpdateChunk();
        //     }, 20);
        //     clearTimeout(pauseTimer);
        // }

        // const nextCurrentSubtitles = subtitlesHandler.current.getSubtitles(timeMs);
        // const isChanged = JSON.stringify(prevCurrentSubtitles) !== JSON.stringify(nextCurrentSubtitles);
        // if (isChanged) setCurrentSubs(nextCurrentSubtitles);

        // timer = setTimeout(formatSubs, 64);
    }

    const { currentSubtitles } = props.subs;
    return <RenderSubs currentSubtitles={currentSubtitles} />;
}

// eslint-disable-next-line react/display-name
const RenderSubs = React.memo(({ currentSubtitles }: { currentSubtitles: SubtitlesItem[] }) => {
    return <RenderSub currentSubtitles={currentSubtitles} />;
});

const RenderSub = ({ currentSubtitles }: { currentSubtitles: SubtitlesItem[] }) => {
    const minify = currentSubtitles.length > 3;
    const classes = `subs-container${minify ? ' subs-container_minified' : ''}`;
    return (
        <div className={classes}>
            {currentSubtitles.map(subtitlesItem => (
                <div
                    key={subtitlesItem.text + subtitlesItem.end + subtitlesItem.start}
                    className="sub-line"
                >
                    {subtitlesItem.text}
                </div>
            ))}
        </div>
    );
};

const mapStateToProps = state => ({
    media: state.media,
    showSubs: state.media.showSubs,
    subs: state.media.subs,
});

const mapDispatchToProps = {
    updateSubs: (payload: any) => ({ type: types.SET_SUBS, payload }),
    setCurrentSubs: (payload: any) => ({ type: types.SET_CURRENT_SUBS, payload }),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SubtitlesContainer);

import { store } from "../store";
import { parse as parseSubtitles } from "subtitle";
import * as types from '../constants/actionTypes'
const PREEMPTIVE_TIME = 30;
const UPDATE_INTERVAL = 10;

const newLineRegExp = new RegExp(/\n/, 'gm');
const bracketsRegExp = new RegExp(/^<.*>(.*)<\/.*>$/);

const DELAY = 75;

export default class SubtitlesHandler {
    subs: any[];
    subsChunk: any[];
    currentTime: number;
    timer: NodeJS.Timeout;
    constructor() {
        this.subs = [];
        this.subsChunk = [];

        this.currentTime = 0;

        this.timer = null;

        this.updateSubsChunk();
    }

    public setSubtitles(subtitles: any[]) {
        this.subs = subtitles;
        this.setSubsChunk();
    }

    public setCurrentTime(timeMs: number) {
        const difference = Math.abs(this.currentTime - timeMs);
        this.currentTime = timeMs + DELAY;
        if (difference > 200)
            this.updateSubsChunk();
    }

    public updateSubsChunk = (callback?) => {
        clearTimeout(this.timer);
        this.timer = setTimeout(this.updateSubsChunk, UPDATE_INTERVAL * 1000);
        return this.setSubsChunk(callback);
    };

    private setSubsChunk = (callback?) => {
        const { currentTime, subs: subtitles } = this;
        const preemptiveTime = PREEMPTIVE_TIME * 1000;

        const subsList = subtitles.filter(
            s =>
                (s.start <= currentTime && currentTime <= s.end) ||
                (s.start >= currentTime && currentTime + preemptiveTime >= s.end)
        );

        this.subsChunk = this.removeBrackets(subsList);

        if (callback)
            return callback();
    };

    private removeBrackets = subtitles => {
        return subtitles.map(el => {
            return {
                ...el,
                text: (el.text = el.text
                    .replace(newLineRegExp, ' ')
                    .replace(bracketsRegExp, '$1')),
            };
        });
    };

    public getSubtitles = (timeMs: number) => {
        const difference = Math.abs(this.currentTime - timeMs);
        this.currentTime = timeMs + DELAY;
        if (difference > 200)
            return this.updateSubsChunk(() =>
                this.findCurrentSubtitles()
            );

        return this.findCurrentSubtitles();
    };

    private findCurrentSubtitles = () => {
        return this.subsChunk.filter(s =>
            s.start <= this.currentTime && this.currentTime <= s.end
        );
    };

    public destroy() {
        clearTimeout(this.timer);
    }
}

export function parseAndDispatchSubtitiles(data: string) {
    try {
        const parsed = parseSubtitles(data);
        store.dispatch({ type: types.SET_SUBS, payload: { parsed } })
        return store.dispatch({ type: types.SHOW_SUBS })
    } catch (error) { }
}

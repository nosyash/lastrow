import { store } from '../store';
import { parse as parseSubtitles } from 'subtitle';
import striptags from 'striptags';
import * as types from '../constants/actionTypes'
import { SubtitlesItem } from '../reducers/media';
const PREEMPTIVE_TIME = 30;
const UPDATE_INTERVAL = 10;

const newLineRegExp = new RegExp(/\n/, 'gm');
const bracketsRegExp = new RegExp(/^<.*>(.*)<\/.*>$/);

const DELAY = 75;

export default class SubtitlesHandler {
    public ready: boolean;
    private subs: any[];
    private subsChunk: any[];
    private currentTime: number;
    private timer: NodeJS.Timeout;
    constructor(private subsRaw: string) {
        this.subsRaw = subsRaw;
        this.subs = [];
        this.subsChunk = [];
        this.currentTime = 0;
        this.timer = null;
        this.ready = false;

        this.parse(this.subsRaw);
    }

    public setCurrentTime(timeMs: number, cb?: (...args) => void) {
        const difference = Math.abs(this.currentTime - timeMs);
        this.currentTime = timeMs + DELAY;
        if (difference > 200) {
            this.updateSubsChunk();
        }

        if (cb) {
            return cb();
        }
    }

    public forceUpdateChunk = () => this.updateSubsChunk();

    public getCurrentSubtitles = () => {
        return this.findCurrentSubtitles();
    };

    private parse(raw: string) {
        try {
            const parsed = (parseSubtitles(raw) || []) as SubtitlesItem[];
            parsed.forEach(item => {
                item.text = striptags(item.text);
            })
            this.setSubtitles(parsed);
        } catch (error) {
            console.log('There was an error while parsing subtitles')
            console.error(error)
        }
    }

    private updateSubsChunk = (cb?: (...args) => void) => {
        clearTimeout(this.timer);
        this.timer = setTimeout(this.updateSubsChunk, UPDATE_INTERVAL * 1000);
        return this.setSubsChunk(cb);
    };

    private setSubtitles(subtitles: any[]) {
        this.subs = subtitles;
        this.setSubsChunk();
        this.ready = true;
    }

    private setSubsChunk = (cb?: (...args) => void) => {
        const { currentTime, subs: subtitles } = this;
        const preemptiveTime = PREEMPTIVE_TIME * 1000;

        const subsList = subtitles.filter(
            s =>
                (s.start <= currentTime && currentTime <= s.end) ||
                (s.start >= currentTime && currentTime + preemptiveTime >= s.end)
        );

        this.subsChunk = this.removeBrackets(subsList);

        if (cb) return cb();
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
    private findCurrentSubtitles = () => {
        return this.subsChunk.filter(s =>
            s.start <= this.currentTime && this.currentTime <= s.end
        );
    };

    public destroy() {
        clearTimeout(this.timer);
    }
}

export function isSrt(data: string): boolean {
    try {
        return parseSubtitles(data).length > 1
    } catch (error) {
        return false
    }
}

export function parseAndDispatchSubtitles(data: string) {
    try {
        const parsed = parseSubtitles(data);
        store.dispatch({ type: types.SET_SUBS, payload: { parsed } })
        return store.dispatch({ type: types.SHOW_SUBS })
    } catch (error) { }
}

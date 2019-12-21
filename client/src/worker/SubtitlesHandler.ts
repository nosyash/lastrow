import { SubtitlesItem } from '../reducers/media';
import WebWorkerResponser from './WebWorkerResponser';
import { parse as parseSubtitles } from 'subtitle';
import striptags from 'striptags';

const PREEMPTIVE_TIME = 30;
const UPDATE_INTERVAL = 10;

const newLineRegExp = new RegExp(/\n/, 'gm');
const bracketsRegExp = new RegExp(/^<.*>(.*)<\/.*>$/);

const DELAY = 100;

export default class SubtitlesHandler {
    public ready: boolean;
    private subs: SubtitlesItem[];
    private lastSubs: SubtitlesItem[];
    private subsChunk: SubtitlesItem[];
    private currentTime: number;
    private timer: NodeJS.Timeout;
    private mainTimer: NodeJS.Timeout;
    constructor(private subsRaw: string) {
        this.subsRaw = subsRaw;
        this.subs = [];
        this.lastSubs = [];
        this.subsChunk = [];
        this.currentTime = 0;
        this.timer = null;
        this.mainTimer = null;
        this.ready = false;
        this.parse(this.subsRaw);
    }

    public setCurrentTime(timeMs: number, cb?: (...args) => void) {
        const difference = Math.abs(this.currentTime - timeMs);
        this.currentTime = timeMs + DELAY;
        if (difference > 300)
            this.updateSubsChunk();

        if (cb) return cb();
    }

    public forceUpdateChunk = () => this.updateSubsChunk();

    private getCurrentSubtitles = () => {
        return this.findCurrentSubtitles();
    };

    private watchSubtitles() {
        this.mainTimer = setTimeout(() => {
            const currentSubtitles = this.getCurrentSubtitles()
            if (this.subtitlesHasChanged(currentSubtitles)) {
                WebWorkerResponser.subtitlesCurrent(currentSubtitles);
            }
            this.watchSubtitles()
        }, 64);
    }

    private subtitlesHasChanged(currentSubtitles: SubtitlesItem[]) {
        const changed = JSON.stringify(this.lastSubs) !== JSON.stringify(currentSubtitles);
        this.lastSubs = currentSubtitles;
        return changed;
    }

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
        // clearTimeout(this.timer);
        this.timer = setTimeout(this.updateSubsChunk, UPDATE_INTERVAL * 1000);
        return this.setSubsChunk(cb);
    };

    private setSubtitles(subtitles: any[]) {
        this.subs = subtitles;
        // this.setSubsChunk();
        this.updateSubsChunk();
        this.ready = true;
        WebWorkerResponser.subtitlesReady();
        this.watchSubtitles();
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
        clearTimeout(this.mainTimer);
        this.subsChunk = []
        this.subs = []
        this.lastSubs = []
    }
}
let subtitlesHandler = null;
export const setSubsTime = (ms: number) => subtitlesHandler ? subtitlesHandler.setCurrentTime(ms) : null
export const subtitlesDestroy = () => subtitlesHandler ? subtitlesHandler.destroy() : null

export function initSubs(raw: string) {
    subtitlesDestroy()
    subtitlesHandler = new SubtitlesHandler(raw)
}

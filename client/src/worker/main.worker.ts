
const ctx: Worker = self as any;

import { parse as parseSubtitles } from "subtitle";
import striptags from "striptags";
import { SubtitlesItem } from "../reducers/media";
import { MESSAGE_TYPE, WorkerMessage, MESSAGE_KIND } from './types';
const PREEMPTIVE_TIME = 30;
const UPDATE_INTERVAL = 10;

const newLineRegExp = new RegExp(/\n/, 'gm');
const bracketsRegExp = new RegExp(/^<.*>(.*)<\/.*>$/);

const DELAY = 100;

let subtitlesHandler = null as SubtitlesHandler;

ctx.addEventListener('message', (message: any) => {
    const { type, data, kind } = message.data as WorkerMessage;
    if (type !== MESSAGE_TYPE.REQUEST) return;
    switch (kind) {
    case MESSAGE_KIND.SUBTITLES_INIT:
        return initSubs(data.subtitles.raw);

    case MESSAGE_KIND.SUBTITLES_SET_TIME:
        return setSubsTime(data.subtitles.time);

    default:
        break;
    }
});

function initSubs(raw: string) {
    if (subtitlesHandler) subtitlesHandler.destroy();
    subtitlesHandler = new SubtitlesHandler(raw)
}

function setSubsTime(timeMs: number) {
    if (!subtitlesHandler) return;
    subtitlesHandler.setCurrentTime(timeMs)
}

const workerResponse = {
    subtitlesReady() {
        ctx.postMessage({
            type: MESSAGE_TYPE.RESULT,
            kind: MESSAGE_KIND.SUBTITLES_READY,
            data: {
                subtitles: {
                    message: 'Ready'
                }
            }
        })
    },
    subtitlesCurrent(current: SubtitlesItem[]) {
        ctx.postMessage({
            type: MESSAGE_TYPE.RESULT,
            kind: MESSAGE_KIND.SUBTITLES_CURRENT,
            data: {
                subtitles: {
                    current,
                }
            }
        })
    },
    error(message: string) {
        ctx.postMessage({
            type: MESSAGE_TYPE.ERROR,
            kind: MESSAGE_KIND.GENERIC,
            data: {
                message,
            }
        })
    }
}

class SubtitlesHandler {
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
            if (this.subtitlesHasChanged(currentSubtitles))
                workerResponse.subtitlesCurrent(currentSubtitles);
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
        workerResponse.subtitlesReady();
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
    }
}

// fixes typescript error
export default {} as typeof Worker & (new () => Worker);

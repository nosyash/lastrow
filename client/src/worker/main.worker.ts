
const ctx: Worker = self as any;

import { parse as parseSubtitles } from "subtitle";
import striptags from "striptags";
import { SubtitlesItem } from "../reducers/media";
import { MESSAGE_TYPE, WorkerMessage, MESSAGE_KIND } from './types';
const PREEMPTIVE_TIME = 30;
const UPDATE_INTERVAL = 10;

const newLineRegExp = new RegExp(/\n/, 'gm');
const bracketsRegExp = new RegExp(/^<.*>(.*)<\/.*>$/);

const DELAY = 75;

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
        if (difference > 200)
            this.updateSubsChunk();

        if (cb) return cb();
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
        workerResponse.subtitlesReady();
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

// fixes typescript error
export default {} as typeof Worker & (new () => Worker);

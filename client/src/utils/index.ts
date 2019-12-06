import { Video } from './types';
import { Role } from '../reducers/profile';

/* eslint-disable no-new */
export function toggleUserSelect() {
    document.body.classList.toggle('no-select');
}

export function toggleCursorMove() {
    document.body.classList.toggle('cursor-move');
}

export function toggleCursor(cursor: string) {
    const { style } = document.documentElement;
    if (style.cursor) {
        style.cursor = '';
        return;
    }
    style.setProperty('cursor', cursor, 'important');
}

export function unsetCursorStyle() {
    document.documentElement.style.cursor = ``;
}

export function setCursorStyle(cur: string) {
    if (!cur) {
        unsetCursorStyle();
        return;
    }
    document.documentElement.style.setProperty('cursor', `${cur}-resize`, 'important');
}

export function togglePointerEvent(element: HTMLElement) {
    if (element.style.pointerEvents) {
        element.style.pointerEvents = '';
        return;
    }
    element.style.pointerEvents = 'none';
}

export const formatTime = (num: any) => {
    const secNum = parseInt(num, 10);
    const hours = Math.floor(secNum / 3600);
    let hoursString = hours.toString();
    const minutes = Math.floor((secNum - hours * 3600) / 60);
    const seconds = secNum - hours * 3600 - minutes * 60;
    let secondsString = seconds.toString()

    if (seconds < 10) secondsString = `0${secondsString}`;

    if (hours === 0) hoursString = '';
    else hoursString += ':';

    return `${hoursString}${minutes}:${secondsString}`;
};

export const getCenteredRect = (w: number, h: number) => {
    // const { width: w, height: h } = el.getBoundingClientRect();
    const aspect = w / h;
    const pW = document.body.clientWidth;
    const pH = window.innerHeight;
    let width = Math.min(w, pW);
    let height = Math.ceil(width / aspect);
    if (height > pH) {
        height = pH;
        width = Math.ceil(height * aspect);
    }
    const left = (pW - width) / 2;
    const top = (pH - height) / 2;
    return { width, height, left, top };
};

export const getRandom = (m: number) => {
    let s = '';
    const r = 'abcdefABCDEF0123456789';
    for (let i = 0; i < m; i++) {
        s += r.charAt(Math.floor(Math.random() * r.length));
    }
    return s;
};

export function getFirstOccurrences(array: any[], condition: (arr: any[]) => boolean) {
    const newArray = [];
    let hasItem = false;
    let j = 0;
    for (let i = 0; i < array.length; i++) {
        if (!condition(array[i])) {
            if (hasItem) {
                console.log(j);
                break;
            }
        } else {
            newArray.push(array[i]);
            hasItem = true;
        }
        j = i;
    }
    console.log(j);
    return newArray;
}

export function sortPlaylistByIndex(playlist: Video[]) {
    return playlist.sort((a, b) => (a.index > b.index ? 1 : -1));
}

export function reverse(s: string) {
    let s2 = '';
    for (let i = s.length - 1; i >= 0; i--) {
        s2 += s[i];
    }
    return s2;
}

export const mod = (n: number, m: number) => ((n % m) + m) % m;

// export function formatTime(sec) {
//   date = new Date(null);
//   date.setSeconds(sec);
//   var result = date.toISOString().substr(11, 8);
//   console.log(result)
// }

export function requestFullscreen(element: HTMLElement) {
    if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}

export function notify(text: string, options: {}) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        const n = new Notification(text, options);
        handleNotifyClose(n);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission(permission => {
            if (permission === 'granted') {
                const n = new Notification(text, options);
                handleNotifyClose(n);
            }
        });
    }
}

function handleNotifyClose(n: Notification) {
    setTimeout(() => {
        n.close();
    }, 4000);
}

export function getCookie(name) {
    const value = '; ' + document.cookie;
    const parts = value.split('; ' + name + '=');
    if (parts.length == 2) return parts.pop().split(';').shift();
}

export function parseJwt (token: string) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

interface JWT {
    Exp: number;
    UUID: string;
    auth_rooms: any;
    is_admin: boolean;
    roles?: Role[];
}

export function getJWTBody(jwt = ''): JWT {
    try {        
        const [_, jwtBody] = jwt.split('.')
        const output = JSON.parse(atob(jwtBody))
        output.roles = output.Roles
        delete output.Roles
        return output;
    // eslint-disable-next-line no-empty
    } catch (_) {}
}

export const wait = (number = 1000) => new Promise(resolve => setTimeout(() => resolve(), number))

export const safelyParseJson = (input: string): any => {
    try {
        return JSON.parse(input)
    } catch (error) {
        return {}
    }
}

export function dispatchCustomEvent(name: string, details = {} as { [key: string]: any }): boolean {
    const event = new CustomEvent(name, { 'detail': details })
    return document.dispatchEvent(event);
}

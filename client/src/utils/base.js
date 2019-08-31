export function toggleUserSelect() {
  document.body.classList.toggle('no-select');
}

export function toggleCursorMove() {
  document.body.classList.toggle('cursor-move');
}

export function toggleCursor(cursor) {
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

export function setCursorStyle(cur) {
  if (!cur) {
    unsetCursorStyle();
    return;
  }
  document.documentElement.style.setProperty('cursor', `${cur}-resize`, 'important');
}

export function togglePointerEvent(element) {
  if (element.style.pointerEvents) {
    element.style.pointerEvents = '';
    return;
  }
  element.style.pointerEvents = 'none';
}

export function resetStyles(element) {
  element.style = '';
}

export const formatTime = num => {
  const secNum = parseInt(num, 10);
  let hours = Math.floor(secNum / 3600);
  const minutes = Math.floor((secNum - hours * 3600) / 60);
  let seconds = secNum - hours * 3600 - minutes * 60;

  if (seconds < 10) seconds = `0${seconds}`;

  if (hours === 0) hours = '';
  else hours += ':';

  return `${hours}${minutes}:${seconds}`;
};

export const getCenteredRect = (w, h) => {
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

export const getRandom = m => {
  let s = '';
  const r = 'abcdefABCDEF0123456789';
  for (let i = 0; i < m; i++) {
    s += r.charAt(Math.floor(Math.random() * r.length));
  }
  return s;
};

export function getFirstOccurrences(array, condition) {
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

export function sortPlaylistByIndex(playlist) {
  return playlist.sort((a, b) => (a.index > b.index ? 1 : -1));
}

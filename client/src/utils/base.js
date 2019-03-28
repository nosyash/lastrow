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

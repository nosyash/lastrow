import {
  PREFORMATTED,
  PARAGRAPH,
  BOLD,
  ITALIC,
  SPOILER,
  EMOTE,
  ME,
  DO,
  TODO,
  QUOTE,
  LINK,
  CENSORED,
} from '../constants';
import { store } from '../store';

function handleEmotes(body = '') {
  const { list: emoteList } = store.getState().emojis;
  return body.replace(EMOTE, (match, ...args) => {
    const emoteName = args[2];
    const emoteFounded = emoteList.find(emote => emote.name === emoteName);
    if (!emoteFounded) return match;
    const { url, url2x } = emoteFounded;

    let string = '';
    string += args[0];
    string += `<img className="emote" src="${url}" srcSet="${url} 1x, ${url2x} 2x" title="`;
    string += args[2];
    string += `">`;
    string += args[4];
    return string;
  });
}

export default function parseMarkup({ body, name }) {
  const { users } = store.getState().Chat.users;
  const { list: emojiList } = store.getState().emojis;

  let tempBody = body;
  const preformated = PREFORMATTED.test(tempBody);
  const hideHeader = ME.test(tempBody) || DO.test(tempBody) || TODO.test(tempBody);
  if (preformated) tempBody = tempBody.replace(PREFORMATTED, '<pre>$2</pre>');

  const isSad = Math.random() < 0.1;
  const src = isSad
    ? 'https://files.catbox.moe/iq25ih.png'
    : 'https://files.catbox.moe/gawu0e.png';
  if (!preformated) {
    tempBody = tempBody
      .replace(PARAGRAPH, '<p>$1</p>')
      .replace(LINK, `<a href="$1" target="_blank">$1</a>`)
      .replace(ME, `<em className="me">${name} $1</em>`)
      .replace(DO, `<em title="${name}" className="do">$1</em>`)
      .replace(QUOTE, `<em className="quote">$1</em>`)
      .replace(BOLD, '<strong>$2</strong>')
      .replace(ITALIC, '<em>$2</em>')
      .replace(
        CENSORED,
        (_, ...args) =>
          `<em className="censored">${String('*').repeat(args[1].length)}</em>`
      )
      .replace(SPOILER, '<del>$2</del>');

    tempBody = handleEmotes(tempBody);
  }
  if (!preformated) {
    if (EMOTE.test(tempBody)) {
      console.log(emojiList);
      emojiList.some(el => el.name === 8);
      // emojiList.map(e => {

      // })
    }
  }
  return { tempBody, hideHeader };
}

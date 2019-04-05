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
} from '../constants';

export default function parseMarkup({ body, emojiList, name }) {
  let tempBody = body;
  const preformated = PREFORMATTED.test(tempBody);
  const hideHeader = ME.test(tempBody) || DO.test(tempBody) || TODO.test(tempBody);
  if (preformated) tempBody = tempBody.replace(PREFORMATTED, '<pre>$2</pre>');
  if (!preformated) {
    tempBody = tempBody
      .replace(PARAGRAPH, '<p>$1</p>')
      .replace(ME, `<em className="me">${name} $1</em>`)
      .replace(DO, `<em title="${name}" className="do">$1</em>`)
      .replace(QUOTE, `<em className="quote">$1</em>`)
      .replace(BOLD, '<strong>$2</strong>')
      .replace(ITALIC, '<em>$2</em>')
      .replace(SPOILER, '<del>$2</del>')
      .replace(
        EMOTE,
        '<img className="emote" src="https://files.catbox.moe/iq25ih.png" srcSet="https://files.catbox.moe/iq25ih.png 1x, https://files.catbox.moe/igwn7x.png 2x" title="$1$2$3"></img>'
      );
  }
  console.log(tempBody);
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

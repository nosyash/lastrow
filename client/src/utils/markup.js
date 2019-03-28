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
} from '../constants';

export default function parseMarkup({ body, emojiList, name }) {
  let tempBody = body;
  const preformated = PREFORMATTED.test(tempBody);
  const hideHeader = ME.test(tempBody) || DO.test(tempBody) || TODO.test(tempBody);
  if (preformated) {
    tempBody = tempBody.replace(PREFORMATTED, '<pre>$2</pre>');
  }
  if (!preformated) {
    tempBody = tempBody.replace(PARAGRAPH, '<p>$1</p>');
    tempBody = tempBody.replace(ME, `<em className="me">${name} $1</em>`);
    tempBody = tempBody.replace(DO, `<em title="${name}" className="do">$1</em>`);
    tempBody = tempBody.replace(TODO, `<em className="todo">«$1», – сказал ${name} $2.</em>`);
    tempBody = tempBody.replace(BOLD, '<strong>$2</strong>');
    tempBody = tempBody.replace(ITALIC, '<em>$2</em>');
    tempBody = tempBody.replace(SPOILER, '<del>$2</del>');
    tempBody = tempBody.replace(
      EMOTE,
      // '<img className="emote" src="$2" title="$1$2$3"></img>'
      '<img className="emote" src="https://files.catbox.moe/iq25ih.png" srcSet="https://files.catbox.moe/iq25ih.png 1x, https://files.catbox.moe/igwn7x.png 2x" title="$1$2$3"></img>'
    );
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

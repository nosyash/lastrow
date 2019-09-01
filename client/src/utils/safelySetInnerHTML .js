import SafelySetInnerHTML from 'safely-set-inner-html';

const mySafelySetInnerHTML = new SafelySetInnerHTML({
  ALLOWED_TAGS: ['a', 'strong', 'p', 'em', 'del', 'pre', 'img'],
  ALLOWED_ATTRIBUTES: ['href', 'class', 'className', 'srcSet', 'src', 'title', 'target'],
});

export default mySafelySetInnerHTML.transform;

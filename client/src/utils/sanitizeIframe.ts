import SafelySetInnerHTML from 'safely-set-inner-html';

const mySafelySetInnerHTML = new SafelySetInnerHTML({
    ALLOWED_TAGS: ['iframe'],
    ALLOWED_ATTRIBUTES: ['class', 'className', 'src', 'allowfullscreen', 'height', 'width', 'allow'],
});

export default mySafelySetInnerHTML.transform;

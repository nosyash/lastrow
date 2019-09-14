import showdown from 'showdown';

showdown.extension('smile', {
    type: 'lang',
    filter(text) {
        return text.replace(/:[a-zA-Z0-9_]+:/g, (match, group) => {
            console.log(match, group);
            return 'REPLACED';
            // return myShowdownExtensionProcessor(group);
        });
    },
});

showdown.extension('link', {
    type: 'lang',
    filter(text) {
        return text.replace(/(https?:\/\/[^\s<]+)/gim, (match, group) => {
            console.log(group);
            return 'link';
            // return myShowdownExtensionProcessor(group);
        });
    },
});

const customConverter = new showdown.Converter({
    simplifiedAutoLink: true,
    extensions: ['smile'],
});

export default customConverter;

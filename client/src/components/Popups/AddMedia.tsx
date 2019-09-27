import React, { Component, Props, ChangeEvent } from 'react';
import { connect } from 'react-redux';
import Joi from 'joi-browser';
import * as api from '../../constants/apiActions';
import * as types from '../../constants/actionTypes';
import { webSocketSend } from '../../actions';
import { toastOpts } from '../../conf';
import { toast } from 'react-toastify';
import { MAXIMUM_SUBTITLES_SIZE } from '../../constants';
import { get } from 'lodash';

// import * as types from '../../constants/ActionTypes';

interface AddMediaProps {
    uuid: any;
    setToPending: any;
    setToDone: any;
    addMediaPending: boolean;
}

interface AddMediaStates {
    inputValue: string;
    iframe: boolean;
    subtitles: boolean;
}

class AddMedia extends Component<AddMediaProps, AddMediaStates> {
    subs64 = null as String | ArrayBuffer;
    state = {
        inputValue: '',
        iframe: false,
        subtitles: false,
    };

    inputEl = React.createRef();

    schema = {
        link: Joi.string()
            .required()
            .min(1)
            .label('Link'),
    };

    componentDidMount() {
        // TODO: For some reason it's not working right away
        setTimeout(() => {
            const element = (this.inputEl.current as HTMLInputElement);
            if (element)
                element.focus();
        }, 100);
    }

    renderMediaElement = (element, i) => (
        <div key={i} className="paylist-item">
            <a className="control" target="_blank" rel="noopener noreferrer" href={element.url}>
                {element.title}
            </a>
        </div>
    );

    handleSubmit = (e) => {
        const { uuid, setToPending, setToDone } = this.props as any;
        e.preventDefault();

        const { inputValue } = this.state;

        const message = api.SEND_MEDIA_TO_PLAYLIST({ url: inputValue, uuid });
        webSocketSend(message, 'feedback', onSuccess as any);
        const self = this;
        function onSuccess(result: any, error: any) {
            if (error)
                console.warn('error while adding to playlist:', error);
            if (result)
                self.setState({ inputValue: '' });
            setToDone();
        }
        setToPending();
    };

    onAddIframeClick = (e: React.MouseEvent) => {
        e.preventDefault();
        this.setState({ inputValue: '', iframe: !this.state.iframe })
    }

    onAddSubtitlesClick = (e: React.MouseEvent) => {
        e.preventDefault();
        this.subs64 = null;
        this.setState({ subtitles: !this.state.subtitles })
    }

    handleSubsFile({ target }: { target: HTMLInputElement }) {
        const file = get(target, 'files[0]');
        if (!file) return;
        const { name, type, size } = file;
        if (size / 1024 > MAXIMUM_SUBTITLES_SIZE) return this.sizeWarn();

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result;
            this.subs64 = base64;
        };
        reader.onerror = () => this.convertingErrorWarn();
    }

    sizeWarn() {
        toast.warn(`Subtitles should be no bigger than ${MAXIMUM_SUBTITLES_SIZE}MB`, toastOpts)
    }

    convertingErrorWarn() {
        toast.error('An error occurred while reading the file.', toastOpts);
    }

    render() {
        const { addMediaPending } = this.props;
        const { iframe, subtitles } = this.state;
        return (
            <div className="add-media_container">
                <form onSubmit={this.handleSubmit}>
                    {!iframe && this.urlInput()}
                    {iframe && this.iframeInput()}
                    {subtitles && this.subtitlesInput()}
                    {this.submitButton()}
                </form>
                {this.iframeToggle()}
            </div>
        );
    }

    urlInput() {
        return (
            <input
                id="add-media-input"
                ref={this.inputEl as any}
                value={this.state.inputValue}
                onChange={({ target }) => this.setState({ inputValue: target.value })}
                className="form-control form-input add-media-input"
            />
        )
    }

    iframeInput() {
        return (
            <textarea
                value={this.state.inputValue}
                onChange={({ target }) => this.setState({ inputValue: target.value })}
                className="form-control form-input add-media-input"
            />
        )
    }

    subtitlesInput() {
        return (
            <label className="button add-subs-button">
                <input type="file" onChange={this.handleSubsFile} />
                Add subtitles
            </label>
        )
    }

    submitButton() {
        return (
            <button
                type="submit"
                disabled={this.props.addMediaPending || !this.state.inputValue.length}
                className="button button-submit add-media-button"
            >
                Add
            </button>
        )
    }

    iframeToggle() {
        return (
            <a
                href=""
                onClick={this.onAddIframeClick}
                className="add-iframe"
            >
                Add iframe code
            </a>
        )
    }

    subtitlesToggle() {
        return (
            <a
                href=""
                onClick={this.onAddIframeClick}
                className="add-iframe"
            >
                Add subtitles
            </a>
        )
    }
}

const mapStateToProps = state => ({
    playlist: state.media.playlist,
    uuid: state.profile.uuid,
    addMediaPending: state.media.addMediaPending,
});

const mapDispatchToProps = {
    removePopup: payload => ({ type: types.REMOVE_POPUP, payload }),
    setAddMediaPending: payload => ({ type: types.SET_ADD_MEDIA_PENDING, payload }),
    setToPending: () => ({ type: types.SET_ADD_MEDIA_PENDING, payload: true }),
    setToDone: () => ({ type: types.SET_ADD_MEDIA_PENDING, payload: false }),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AddMedia);

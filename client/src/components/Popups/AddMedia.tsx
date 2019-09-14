import React, { Component, Props } from 'react';
import { connect } from 'react-redux';
import Joi from 'joi-browser';
import * as api from '../../constants/apiActions';
import * as types from '../../constants/actionTypes';
import { webSocketSend } from '../../actions';
// import * as types from '../../constants/ActionTypes';

interface AddMediaProps {
    uuid: any;
    setToPending: any;
    setToDone: any;
    addMediaPending: boolean;
}

interface AddMediaStates {
    inputValue: string;
}

class AddMedia extends Component<AddMediaProps, AddMediaStates> {
    state = {
        inputValue: '',
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
        webSocketSend(message, 'success', onSuccess as any);
        function onSuccess(result: any, error: any) {
            if (error) console.warn('error while adding to playlist:', error);
            if (result)
                this.setState({ inputValue: '' });
            setToDone();
        }
        setToPending();
    };

    render() {
        const { addMediaPending } = this.props;
        return (
            <div className="add-media_container">
                <form onSubmit={this.handleSubmit}>
                    <input
                        id="add-media-input"
                        ref={this.inputEl as any}
                        value={this.state.inputValue}
                        onChange={({ target }) => this.setState({ inputValue: target.value })}
                        className="form-control form-input add-media-input"
                    />
                    <button
                        type="submit"
                        disabled={addMediaPending}
                        className="button button-submit add-media-button"
                    >
                        Add
                    </button>
                </form>
            </div>
        );
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

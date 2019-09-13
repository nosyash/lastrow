import React, { Component } from 'react';
import { connect } from 'react-redux';
import Joi from 'joi-browser';
import Form from '../Form';
import * as api from '../../../constants/apiActions';
import * as types from '../../../constants/ActionTypes';
import { webSocketSend } from '../../../actions';
import { ADD_MEDIA } from '../../../constants';
// import * as types from '../../constants/ActionTypes';

class AddMedia extends Component {
  state = {
    data: { link: '' },
    inputValue: '',
    errors: {},
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
      this.inputEl.current.focus();
    }, 100);
  }

  renderMediaElement = (element, i) => (
    <div key={i} className="paylist-item">
      <a className="control" target="_blank" rel="noopener noreferrer" href={element.url}>
        {element.title}
      </a>
    </div>
  );

  handleSubmit = e => {
    const { uuid, setToPending, setToDone } = this.props;
    e.preventDefault();

    const { inputValue } = this.state;

    const message = api.SEND_MEDIA_TO_PLAYLIST({ url: inputValue, uuid });
    webSocketSend(message, 'success', onSuccess);
    function onSuccess(result, error) {
      if (error) console.warn('error while adding to playlist:', error);
      // if (result) removePopup('addMedia');
      setToDone();
    }
    setToPending();
  };

  render() {
    const { addMediaPending } = this.props;
    return (
      <div className="add-media_container">
        <form onSubmit={this.handleSubmit}>
          {/* <span className="icon">
            <i className="fas fa-link" />
          </span> */}
          <input
            id="add-media-input"
            ref={this.inputEl}
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
  playlist: state.Media.playlist,
  uuid: state.profile.uuid,
  addMediaPending: state.Media.addMediaPending,
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

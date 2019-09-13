import React from 'react';
import { connect } from 'react-redux';
import Joi from 'joi-browser';
import Form from '../Form';
import * as api from '../../../constants/apiActions';
import * as types from '../../../constants/ActionTypes';
import { webSocketSend } from '../../../actions';
import { ADD_MEDIA } from '../../../constants';
// import * as types from '../../constants/ActionTypes';

class AddMedia extends Form {
  state = {
    data: { link: '' },
    errors: {},
  };

  schema = {
    link: Joi.string()
      .required()
      .min(1)
      .label('Link'),
  };

  renderMediaElement = (element, i) => (
    <div key={i} className="paylist-item">
      <a className="control" target="_blank" rel="noopener noreferrer" href={element.url}>
        {element.title}
      </a>
    </div>
  );

  handleSubmit = e => {
    const { uuid, setToPending, setToDone, removePopup } = this.props;
    console.log('submited');
    e.preventDefault();

    const { link } = this.state.data;

    const message = api.SEND_MEDIA_TO_PLAYLIST({ url: link, uuid });
    webSocketSend(message, 'success', onSuccess);
    function onSuccess(result, error) {
      if (error) console.warn('error while adding to playlist:', error);
      if (result) removePopup('addMedia');
      setToDone();
    }
    setToPending();
  };

  render() {
    const { addMediaPending } = this.props;
    return (
      <div className="popup-element add-media_container">
        <form onSubmit={this.handleSubmit}>
          {this.renderInput({
            name: 'link',
            icon: 'link',
            autoFocus: true,
            placeholder: 'Link',
          })}
          {this.renderButton('Add', { disabled: addMediaPending })}
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

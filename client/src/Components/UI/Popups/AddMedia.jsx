import React from 'react';
import { connect } from 'react-redux';
import Joi from 'joi-browser';
import Form from '../Form';
import * as api from '../../../constants/apiActions';
import { webSocketSend } from '../../../actions';
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
    const { uuid } = this.props;
    console.log('submited');
    e.preventDefault();

    const { link } = this.state.data;
    webSocketSend(api.SEND_MEDIA_TO_PLAYLIST({ url: link, uuid }));
  };

  render() {
    return (
      <div className="popup-element add-media_container">
        <form onSubmit={this.handleSubmit}>
          {this.renderInput({
            name: 'link',
            icon: 'link',
            autoFocus: true,
            placeholder: 'Link',
          })}
          {this.renderButton('Add')}
        </form>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  playlist: state.Media.playlist,
  uuid: state.profile.uuid,
});

export default connect(mapStateToProps)(AddMedia);

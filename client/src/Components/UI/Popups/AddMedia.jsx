import React from 'react';
import { connect } from 'react-redux';
import Joi from 'joi-browser';
import Form from '../Form';
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
      <a
        className="control"
        target="_blank"
        rel="noopener noreferrer"
        href={element.url}
      >
        {element.title}
      </a>
    </div>
  );

  handleSubmit = e => {
    console.log('submited');
    e.preventDefault();
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
});

export default connect(mapStateToProps)(AddMedia);

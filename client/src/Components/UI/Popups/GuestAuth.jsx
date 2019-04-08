import React from 'react';
import { connect } from 'react-redux';
import Joi from 'joi-browser';
import * as types from '../../../constants/ActionTypes';
import Form from '../Form';

class GuestAuth extends Form {
  state = {
    data: { name: '' },
    errors: {},
  };

  schema = {
    name: Joi.string()
      .required()
      .min(1)
      .max(15)
      .label('Name'),
  };

  handleSubmit = e => {
    e.preventDefault();
    const { onSubmit } = this.props;
    const { data } = this.state;
    onSubmit(data.name);
  };

  handleClose = () => {
    const { onSubmit } = this.props;
    onSubmit('Guest');
  };

  render() {
    return (
      <RenderForm
        handleSubmit={this.handleSubmit}
        renderInput={this.renderInput}
        renderButton={this.renderButton}
        onClose={this.handleClose}
      />
    );
  }
}

const RenderForm = props => {
  const { handleSubmit, renderInput, renderButton, onClose } = props;
  const inputOpts = {
    name: 'name',
    icon: 'user',
    autoFocus: true,
    placeholder: 'Name',
  };
  return (
    <div className="float-element guest-auth_container">
      <h1 className="title">Enter nickname</h1>
      <form onSubmit={handleSubmit}>
        {renderInput(inputOpts)}
        <div className="controls-container">
          {renderButton('Save')}
          <button
            onClick={onClose}
            type="button"
            className="button button-cancel"
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );
};

const mapStateToProps = state => ({
  profile: state.profile,
});

const mapDispatchToProps = {
  updateProfile: payload => ({ type: types.UPDATE_PROFILE, payload }),
  removePopup: payload => ({ type: types.REMOVE_POPUP, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GuestAuth);

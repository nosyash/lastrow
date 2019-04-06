import React from 'react';
import Joi from 'joi-browser';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import Form from './Form';
import http from '../../utils/httpServices';
import * as api from '../../constants/apiActions';
import * as types from '../../constants/ActionTypes';

class NewRoom extends Form {
  state = {
    signIn: true,
    data: { title: '', path: '' },
    errors: {},
    visiblePass: false,
  };

  schema = {
    title: Joi.string()
      .required()
      .max(20)
      .min(4)
      .label('Title'),
    path: Joi.string()
      .required()
      .max(15)
      .min(4)
      .label('Path'),
  };

  handleSubmit = async e => {
    const { title, path } = this.state.data;
    const { id, history, removeFloat, onRoomsUpdate } = this.props;
    e.preventDefault();
    const res = await http.post(api.API_ROOMS(), api.ROOM_CREATE(title, path));
    if (!res.status) return;
    removeFloat(id);
    // onRoomsUpdate();
    history.push(`/r/${path}`);
  };

  handleClose = () => {
    const { id, removeFloat } = this.props;
    removeFloat(id);
  };

  render() {
    const { onSubmit, id } = this.props;
    return (
      <RenderForm
        onSubmit={onSubmit}
        id={id}
        onClose={this.handleClose}
        handleSubmit={this.handleSubmit}
        renderButton={this.renderButton}
        renderInput={this.renderInput}
      />
    );
  }
}

const RenderForm = ({ handleSubmit, renderInput, renderButton, onClose }) => (
  <div className="float-element room-creation_container">
    <h1 className="title">New Room</h1>
    <form onSubmit={handleSubmit}>
      {renderInput({ name: 'title', icon: 'info', placeholder: 'Title' })}
      {renderInput({ name: 'path', icon: 'link', placeholder: 'Path' })}
      {renderButton('Create')}
      <button onClick={onClose} type="button" className="button button-cancel">
        Cancel
      </button>
    </form>
  </div>
);

const mapDispatchToProps = {
  updateProfile: payload => ({ type: types.UPDATE_PROFILE, payload }),
  renderFloat: payload => ({ type: types.ADD_COMPONENT, payload }),
  removeFloat: payload => ({ type: types.REMOVE_COMPONENT, payload }),
};

export default connect(
  null,
  mapDispatchToProps
)(withRouter(NewRoom));

// export default withRouter(NewRoom);

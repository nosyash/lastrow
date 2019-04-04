import React, { Component } from 'react';
import { connect } from 'react-redux';
import Joi from 'joi-browser';
import { toast } from 'react-toastify';
import Form from './Form';
import http from '../../utils/httpServices';
import { API_ENDPOINT, toastOpts } from '../../constants';

export default class NewRoom extends Form {
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
    e.preventDefault();
    const reqObject = { action: 'room_create', body: { title, path } };
    const reqData = JSON.stringify(reqObject);
    const res = await http.post(`${API_ENDPOINT}/rooms`, reqData);
  };

  render() {
    return (
      <RenderForm
        handleSubmit={this.handleSubmit}
        renderButton={this.renderButton}
        renderInput={this.renderInput}
      />
    );
  }
}

const RenderForm = ({ handleSubmit, renderInput, renderButton }) => (
  <div className="room-creation_container">
    <h1 className="title">New Room</h1>
    <form onSubmit={handleSubmit}>
      {renderInput({ name: 'title', icon: 'info', placeholder: 'Title' })}
      {renderInput({ name: 'path', icon: 'link', placeholder: 'Path' })}
      {renderButton('Create')}
      <button type="button" className="button button-cancel">
        Cancel
      </button>
    </form>
  </div>
);

// {"action": "room_create", "body": { "title": "wjsn", "path": "wjsn6" }}

// mapStateToProps = state => ({})

// mapDispatchToProps = {

// }

// export default connect()(NewRoom);

import React from 'react';
import Joi from 'joi-browser';
import { withRouter } from 'react-router-dom';
import Form from './Form';
import http from '../../utils/httpServices';
import * as api from '../../constants/apiActions';

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
    const { onSubmit, id, history } = this.props;
    e.preventDefault();
    const res = await http.post(api.API_ROOMS(), api.ROOM_CREATE(title, path));
    if (!res.status) return;
    onSubmit(id);
    history.push(`/r/${path}`);
  };

  render() {
    const { onSubmit, id } = this.props;
    return (
      <RenderForm
        onSubmit={onSubmit}
        id={id}
        handleSubmit={this.handleSubmit}
        renderButton={this.renderButton}
        renderInput={this.renderInput}
      />
    );
  }
}

const RenderForm = ({ handleSubmit, renderInput, renderButton, onSubmit, id }) => (
  <div className="room-creation_container">
    <h1 className="title">New Room</h1>
    <form onSubmit={handleSubmit}>
      {renderInput({ name: 'title', icon: 'info', placeholder: 'Title' })}
      {renderInput({ name: 'path', icon: 'link', placeholder: 'Path' })}
      {renderButton('Create')}
      <button onClick={() => onSubmit(id)} type="button" className="button button-cancel">
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

export default withRouter(NewRoom);

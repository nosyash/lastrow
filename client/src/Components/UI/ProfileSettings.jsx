import React, { Component } from 'react';
import { connect } from 'react-redux';
import Joi from 'joi-browser';
import Form from './Form';
import * as api from '../../constants/apiActions';
import * as types from '../../constants/ActionTypes';
import http from '../../utils/httpServices';

class ProfileSettings extends Form {
  state = {
    data: {},
    errors: {},
  };

  schema = {};

  schemas = {
    color: {
      color: Joi.string()
        .required()
        .label('Color'),
    },

    name: {
      name: Joi.string()
        .min(5)
        .max(15)
        .label('Name'),
    },

    image: {
      image: Joi.string().label('Image'),
    },

    password: {
      password: Joi.string()
        .required()
        .label('Current Password'),
      passwordNew: Joi.string()
        .required()
        .min(8)
        .max(42)
        .label('New Password'),
    },
  };

  handleControlClick = e => {
    const { profile } = this.props;
    const { name } = e.target.dataset;
    const data = {};
    data[name] = '';
    if (name === 'password') data.passwordNew = '';
    if (name === 'name') data[name] = profile[name];
    if (name === 'color') data[name] = profile[name];
    this.schema = { ...this.schemas[name] };
    this.setState({ data });

    // if (!res.status) return;
    // removePopup(id);
    // onRoomsUpdate();
    // history.push(`/r/${path}`);

    // switch (name) {
    //   case 'changeName':
    //     break;
    //   case 'changeColor':
    //     break;
    //   case 'changeImage':
    //     break;
    //   case 'changePass':
    //     break;

    //   default:
    //     break;
    // }
  };

  handleSubmit = async e => {
    e.preventDefault();
    const { data } = this.state;
    const { profile, updateProfile } = this.props;
    if (data.name || data.color) {
      console.log('submit name');
      const res = await http.post(api.API_USER(), api.UPDATE_USER(data.name, data.color));
      updateProfile({ ...profile, ...res.data });
    }

    if (data.password && data.passwordNew) {
      console.log('submit pass');
      const res = await http.post(
        api.API_USER(),
        api.UPDATE_PASSWORD(data.password, data.passwordNew)
      );
      console.log(res);
    }
    if (data.image) {
      console.log('submit pass');
      const res = await http.post(api.API_USER(), api.UPDATE_IMAGE('.jpg', data.image));
      updateProfile({ ...profile, ...res.data });
      console.log(res);
    }
    if (data.password) console.log('submit passes');
    this.setState({ data: {} });
    this.schema = {};
  };

  render() {
    const { id, removePopup, profile } = this.props;
    const { changesMade, data } = this.state;
    return (
      <RenderForm
        data={data}
        changesMade={changesMade}
        handleSubmit={this.handleSubmit}
        renderInput={this.renderInput}
        renderButton={this.renderButton}
        onControlClick={this.handleControlClick}
        onClose={() => removePopup(id)}
        profile={profile}
      />
    );
  }
}

const RenderForm = props => {
  const {
    handleSubmit,
    renderInput,
    renderButton,
    onClose,
    data,
    onControlClick,
    profile,
  } = props;
  const {
    color = null,
    image = null,
    name = null,
    password = null,
    passwordNew = null,
  } = data;
  const backgroundImage = `url(${profile.image})`;
  return (
    <div className="float-element profile-settings_container">
      <h1 className="title">Profile Settings</h1>
      <div style={{ backgroundImage }} className="profile-avatar profile-avatar_mini" />
      <RenderControls onClick={onControlClick} />
      <form onSubmit={handleSubmit}>
        {name !== null &&
          renderInput({ name: 'name', icon: 'user', autoFocus: true, placeholder: 'Name' })}
        {color !== null &&
          renderInput({ name: 'color', icon: 'user', autoFocus: true, placeholder: 'Color' })}
        {image !== null &&
          renderInput({ name: 'image', icon: 'user', autoFocus: true, placeholder: 'Image' })}
        {password !== null &&
          renderInput({
            name: 'password',
            type: 'password',
            renderEye: true,
            icon: 'lock',
            autoFocus: true,
            placeholder: 'Current Password',
          })}
        {passwordNew !== null &&
          renderInput({
            name: 'passwordNew',
            type: 'password',
            icon: 'lock',
            placeholder: 'New Password',
          })}
        {Object.entries(data).length !== 0 && renderButton('Save changes')}
        <button onClick={onClose} type="button" className="button button-cancel">
          Close
        </button>
      </form>
    </div>
  );
};

const RenderControls = ({ onClick }) => {
  const constrols = [
    { name: 'name' },
    { name: 'color' },
    { name: 'image' },
    { name: 'password' },
  ];
  return (
    <div className="profile-controls">
      {constrols.map((el, i) => (
        <div key={i}>
          <span onClick={onClick} data-name={el.name} className="control">
            {`Change ${el.name}`}
          </span>
        </div>
      ))}
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
)(ProfileSettings);

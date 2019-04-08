import React from 'react';
import { connect } from 'react-redux';
import Joi from 'joi-browser';
import { toast } from 'react-toastify';
import Form from './Form';
import * as api from '../../constants/apiActions';
import * as types from '../../constants/ActionTypes';
import http from '../../utils/httpServices';
import ImagePicker from './ImagePicker';
import { toastOpts } from '../../constants';

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
        .min(1)
        .max(15)
        .label('Name'),
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
    if (name === 'image') {
      return this.handleImageChange();
    }
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

  handleImageChange = () => {
    const { addPopup } = this.props;
    const id = 'ImagePicker';
    addPopup({
      id,
      el: <ImagePicker id={id} onImageUpdate={this.handleImageUpdate} />,
      width: 600,
      height: 600,
    });
  };

  handleImageUpdate = async data => {
    const { updateProfile } = this.props;
    const res = await http.post(api.API_USER(), api.UPDATE_IMAGE(data));
    if (!res.data) {
      return;
    }
    updateProfile({ ...res.data });
  };

  handleSubmit = async e => {
    e.preventDefault();
    const { updateProfile } = this.props;
    const { profile } = this.props;
    const { data } = this.state;

    if (data.name || data.color) {
      const name = data.name || profile.name;
      const color = data.color || profile.color;
      const res = await http.post(api.API_USER(), api.UPDATE_USER(name, color));
      updateProfile({ ...profile, ...res.data });
    }

    if (data.password && data.passwordNew) {
      const { password, passwordNew } = data;
      const res = await http.post(
        api.API_USER(),
        api.UPDATE_PASSWORD(password, passwordNew)
      );
      if (res.data) {
        toast.success('Password successfully changed', toastOpts);
      }
    }

    if (data.image) {
      const res = await http.post(api.API_USER(), api.UPDATE_IMAGE(data.image));
      updateProfile({ ...profile, ...res.data });
    }

    this.setState({ data: {} });
    this.schema = {};
  };

  render() {
    const { id, removePopup, profile } = this.props;
    const { changesMade, data } = this.state;
    return (
      <RenderForm
        handleImageChange={this.handleImageChange}
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
    handleImageChange,
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
      <div
        onClick={handleImageChange}
        style={{ backgroundImage }}
        className="profile-avatar profile-avatar_mini"
      />
      <RenderControls onClick={onControlClick} />
      <form onSubmit={handleSubmit}>
        {name !== null &&
          renderInput({
            name: 'name',
            icon: 'user',
            autoFocus: true,
            placeholder: 'Name',
          })}
        {color !== null &&
          renderInput({
            name: 'color',
            icon: 'user',
            autoFocus: true,
            placeholder: 'Color',
          })}
        {image !== null &&
          renderInput({
            name: 'image',
            icon: 'user',
            autoFocus: true,
            placeholder: 'Image',
          })}
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
        <div className="controls-container">
          {Object.entries(data).length !== 0 && renderButton('Save changes')}
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

const RenderControls = ({ onClick }) => {
  const constrols = [
    { name: 'name' },
    { name: 'color' },
    { name: 'image' },
    { name: 'password' },
  ];
  return (
    <div className="profile-controls">
      {constrols.map((control, index) => (
        <div key={index}>
          <span onClick={onClick} data-name={control.name} className="control">
            {`Change ${control.name}`}
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
  addPopup: payload => ({ type: types.ADD_POPUP, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProfileSettings);

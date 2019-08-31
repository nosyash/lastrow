import React from 'react';
import { connect } from 'react-redux';
import Joi from 'joi-browser';
import { toast } from 'react-toastify';
import Form from '../Form';
import * as api from '../../../constants/apiActions';
import * as types from '../../../constants/ActionTypes';
import http from '../../../utils/httpServices';
import { toastOpts } from '../../../constants';

// TODO: Extremely poorly made. Refactor!
class ProfileSettings extends Form {
  state = {
    data: {},
    editing: '',
    errors: {},
  };

  schema = {};

  schemas = {
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

  handleControlClick = name => {
    const { profile } = this.props;
    const { editing } = this.state;
    const data = {};
    data[name] = '';

    if (editing === name) {
      return this.setState({ data: {}, editing: '' });
    }

    if (name === 'password' || name === 'name') {
      this.setState({ editing: name });
    }

    if (name === 'password') {
      data.passwordNew = '';
    }

    if (name === 'name') {
      data[name] = profile[name];
    }

    if (name === 'color') {
      data[name] = profile[name];
      this.handleFormReset();
      return this.handleColorPicker();
    }

    if (name === 'image') {
      this.handleFormReset();
      return this.handleImagePicker();
    }

    this.schema = { ...this.schemas[name] };
    this.setState({ data });
  };

  handleImagePicker = () => {
    this.props.addPopup('imagePicker');
  };

  handleColorUpdate = async color => {
    const { updateProfile } = this.props;
    const res = await http.post(api.API_USER(), api.UPDATE_USER('', color));

    if (!res.data) {
      return;
    }
    toast.success('Color successfully changed', toastOpts);
    updateProfile({ ...res.data });
    this.handleFormReset();
  };

  handleSubmit = async e => {
    e.preventDefault();
    const { updateProfile } = this.props;
    const { profile } = this.props;
    const { data } = this.state;

    if (data.name) {
      const name = data.name || profile.name;
      const res = await http.post(api.API_USER(), api.UPDATE_USER(name));
      updateProfile({ ...profile, ...res.data });

      if (res.data) {
        toast.success('Name successfully changed', toastOpts);
      }
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
      const imgSrc = res.data.image ? `/uploads/${res.data.image}` : '';
      updateProfile({ ...profile, ...res.data, image: imgSrc });

      if (res.data) {
        toast.success('Profile image successfully changed', toastOpts);
      }
    }

    this.setState({ data: {}, editing: '' });
    this.schema = {};
  };

  handleFormReset = () => {
    this.setState({ data: {}, editing: '' });
    this.schema = {};
  };

  render() {
    const { id, removePopup, profile } = this.props;
    const { changesMade, data } = this.state;
    return (
      <RenderForm
        handleImageChange={this.handleImagePicker}
        data={data}
        changesMade={changesMade}
        handleSubmit={this.handleSubmit}
        renderInput={this.renderInput}
        renderButton={this.renderButton}
        onControlClick={this.handleControlClick}
        onClose={() => removePopup(id)}
        onFormReset={this.handleFormReset}
        profile={profile}
      />
    );
  }
}

const RenderForm = props => {
  const { onClose, onControlClick, onFormReset } = props;
  const { handleSubmit, handleImageChange } = props;
  const { renderInput, renderButton } = props;
  const { data, profile } = props;

  const { color = null, name = null } = data;
  const { password = null, passwordNew = null } = data;

  const backgroundImage = `url(${profile.image})`;
  const hasChanges = Object.entries(data).length !== 0;
  return (
    <div className="popup-element profile-settings_container">
      <h1 className="title">Profile</h1>
      <div
        onClick={handleImageChange}
        style={{ backgroundImage }}
        title="Change profile image"
        className="profile-avatar profile-avatar_mini"
      />
      <div className="name-contaner">
        <span style={{ color: color || profile.color }} className="title">
          {profile.name}
        </span>
        <span
          title="Change name"
          onClick={() => onControlClick('name')}
          className="control"
        >
          <i className="fa fa-edit" />
        </span>
        <span
          title="Change color"
          onClick={() => onControlClick('color')}
          className="control"
        >
          <i className="fa fa-palette" />
        </span>
      </div>
      <RenderControls onClick={onControlClick} />
      <form onSubmit={handleSubmit}>
        {name !== null &&
          renderInput({
            name: 'name',
            icon: 'user',
            autoFocus: true,
            placeholder: 'Name',
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
          {hasChanges && (
            <React.Fragment>
              {renderButton('Save changes')}

              <button
                onClick={() => (hasChanges ? onFormReset() : onClose())}
                type="button"
                className="button button-cancel"
              >
                Cancel
              </button>
            </React.Fragment>
          )}
        </div>
      </form>
    </div>
  );
};

const RenderControls = ({ onClick }) => (
  <div className="profile-controls">
    <div>
      <span onClick={() => onClick('password')} className="control">
        Change password
      </span>
    </div>
  </div>
);

const mapStateToProps = state => ({
  profile: state.profile,
});

const mapDispatchToProps = {
  updateProfile: payload => ({ type: types.UPDATE_PROFILE, payload }),
  removePopup: payload => ({ type: types.REMOVE_POPUP, payload }),
  addPopup: payload => ({ type: types.ADD_POPUP, payload }),
  togglePopup: payload => ({ type: types.TOGGLE_POPUP, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProfileSettings);

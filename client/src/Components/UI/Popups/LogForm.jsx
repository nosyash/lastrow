import React from 'react';
import Joi from 'joi-browser';
import { toast } from 'react-toastify';
import { connect } from 'react-redux';
import Form from '../Form';
import http from '../../../utils/httpServices';
import { toastOpts } from '../../../Conf';
import * as types from '../../../constants/ActionTypes';
import * as api from '../../../constants/apiActions';
import { NEW_ROOM, PROFILE_SETTINGS } from '../../../constants';

class LogForm extends Form {
  state = {
      signIn: true,
      data: { username: '', password: '' },
      errors: {},
  };

  dataSignin = { username: '', password: '' };

  dataSignup = { ...this.dataSignin, email: '' };

  signin = {
      username: Joi.string()
          .required()
          .min(3)
          .max(15)
          .label('Username'),
      password: Joi.string()
          .required()
          .min(8)
          .max(42)
          .label('Password'),
  };

  signup = {
      ...this.signin,
      email: Joi.string()
          .required()
          .email()
          .label('Email'),
  };

  schema = this.signin;

  handleSubmit = async e => {
      const { signIn, data } = this.state;
      const { password: passwd, username: uname, email } = data;
      // const { updateProfile } = this.props;

      e.preventDefault();

      const reqData = signIn
          ? api.LOG_IN(uname.trim(), passwd)
          : api.REG(uname.trim(), passwd, email.trim());

      const res = await http.post(api.API_AUTH(), reqData);

      if (!res.status) return;
      window.location.reload();
      // const profile = await getProfile();
      // const { avatar, color, name, uuid } = profile.data;
      // updateProfile({ logged: true, avatar: avatar || '', color: color || '', name, uuid });
      // this.setState({ data: { ...data, password: '' } });
  };

  handleLogOut = async () => {
      // const { updateProfile } = this.props;

      const res = await http.post(api.API_AUTH(), api.LOG_OUT());
      if (res.error) return toast.error(res.error, toastOpts);
      // else updateProfile({ logged: false });
      document.cookie = 'session_id=; Max-Age=0;';
      window.location.reload();
  };

  switchLogin = () => {
      const { signIn } = this.state;
      this.setState({ signIn: !signIn });
      if (signIn) {
          this.schema = this.signup;
          this.setState({ data: this.dataSignup });
      } else {
          this.schema = this.signin;
          this.setState({ data: this.dataSignin });
      }
  };

  getOptions = name => {
      switch (name) {
      case 'email':
          return { name, icon: 'at', placeholder: 'Email' };
      case 'username':
          return { name, icon: 'user-circle', placeholder: 'Username' };
      case 'password':
          return {
              name,
              icon: 'lock',
              placeholder: 'Password',
              type: 'password',
              renderEye: true,
          };
      case 'passwordConfirm':
          return {
              name,
              icon: 'lock',
              placeholder: 'Confirm password',
          };
      default:
          return {};
      }
  };

  handleRoomCreation = () => {
      const { addPopup } = this.props;
      addPopup(NEW_ROOM);
  };

  handleProfileSettings = () => {
      const { addPopup } = this.props;
      addPopup(PROFILE_SETTINGS);
  };

  render() {
      const { profile, addPopup } = this.props;
      const { signIn } = this.state;
      const { logged } = profile;
      return (
          <React.Fragment>
              {!logged && (
                  <RenderLoginForm
                      switchLogin={this.switchLogin}
                      renderButton={this.renderButton}
                      getOptions={this.getOptions}
                      renderInput={this.renderInput}
                      handleSubmit={this.handleSubmit}
                      signIn={signIn}
                      logged={profile.logged}
                  />
              )}
              {logged && (
                  <RenderProfile
                      addPopup={addPopup}
                      onProfileSettings={this.handleProfileSettings}
                      handleRoomCreation={this.handleRoomCreation}
                      handleLogOut={this.handleLogOut}
                      profile={profile}
                  />
              )}
          </React.Fragment>
      );
  }
}

const RenderLoginForm = props => {
    const {
        signIn,
        handleSubmit,
        renderInput,
        getOptions,
        renderButton,
        switchLogin,
        logged,
    } = props;
    return (
        <div className="sign-inner">
            {logged === false && (
                <React.Fragment>
                    <h1 className="title">{signIn ? 'Sign In' : 'Sign Up'}</h1>
                    <form onSubmit={handleSubmit}>
                        {!signIn && renderInput(getOptions('email'))}
                        {renderInput(getOptions('username'))}
                        {renderInput(getOptions('password'))}
                        {renderButton(signIn ? 'Login' : 'Register')}
                    </form>
                    <div className="sign-switch_container">
                        <span onClick={switchLogin} className="control sign-switch">
                            {!signIn ? 'Sign In' : 'Sign Up'}
                        </span>
                    </div>
                </React.Fragment>
            )}
        </div>
    );
};

const RenderProfile = props => {
    const { profile } = props;
    const { handleLogOut, handleRoomCreation, onProfileSettings } = props;
    const { image, color, name } = profile;
    const backgroundImage = `url(${image || ''})`;
    return (
        <div className="main-profile">
            <div className="profile">
                <div style={{ backgroundImage }} className="profile-avatar" />
                <h1 style={{ color }} className="title profile-title">
                    {name}
                </h1>
                <div className="main-profile-controls">
                    <span onClick={handleRoomCreation} className="control sign-out">
            Create Room
                    </span>
                    <span onClick={onProfileSettings} className="control">
                        <i className="fas fa-users-cog" />
                    </span>
                    <span className="control">
                        <i className="fas fa-cog" />
                    </span>
                    <span onClick={handleLogOut} className="control sign-out">
            Sign Out
                    </span>
                </div>
            </div>
        </div>
    );
};

const mapDispatchToProps = {
    updateProfile: payload => ({ type: types.UPDATE_PROFILE, payload }),
    addPopup: payload => ({ type: types.ADD_POPUP, payload }),
};

const mapStateToProps = state => ({
    profile: state.profile,
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(LogForm);

import React, { Component } from 'react';
import Joi from 'joi-browser';
import { toast } from 'react-toastify';
import Form from './Form';
import http from '../../utils/httpServices';
import { API_ENDPOINT, toastOpts } from '../../constants';

class LogForm extends Form {
  state = {
    signIn: true,
    data: { username: '', password: '' },
    errors: {},
    visiblePass: false,
  };

  dataSignin = { username: '', password: '' };

  // dataSignup = { ...this.dataSignin, email: '', passwordConfirm: '' };
  dataSignup = { ...this.dataSignin, email: '' };

  signin = {
    username: Joi.string()
      .required()
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
    // passwordConfirm: Joi.string()
    //   .required()
    //   .valid(Joi.ref('password'))
    //   .options({
    //     language: {
    //       any: {
    //         allowOnly: '!!Passwords do not match',
    //       },
    //     },
    //   })
    //   .label('Confirm password'),
  };

  schema = this.signin;

  handleSubmit = async e => {
    const { signIn, data } = this.state;
    e.preventDefault();

    const obj = {
      action: signIn ? 'login' : 'register',
      body: {
        uname: data.username.trim(),
        passwd: data.password,
        email: !signIn ? data.email.trim() : '',
      },
    };

    const res = await http.post(`${API_ENDPOINT}/auth`, JSON.stringify(obj));
    const { data: resData } = res;
    if (resData.error) toast.error(resData.error, toastOpts);
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

  switchType = () => {
    const { visiblePass } = this.state;
    this.setState({ visiblePass: !visiblePass });
  };

  getOptions = name => {
    const { visiblePass } = this.state;
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
          type: visiblePass ? 'text' : 'password',
          element: (
            <span
              onClick={() => this.setState({ visiblePass: !visiblePass })}
              className="control show-pass"
            >
              <i className="fas fa-eye" />
            </span>
          ),
        };
      case 'passwordConfirm':
        return {
          name,
          icon: 'lock',
          placeholder: 'Confirm password',
          type: visiblePass ? 'text' : 'password',
        };
      default:
        return {};
    }
  };

  render() {
    const { signIn } = this.state;
    return (
      <div className="sign-inner">
        <h1 className="title">{signIn ? 'Sign In' : 'Sign Up'}</h1>
        <form onSubmit={this.handleSubmit}>
          {!signIn && this.renderInput(this.getOptions('email'))}
          {this.renderInput(this.getOptions('username'))}
          {this.renderInput(this.getOptions('password'))}
          {/* {!signIn && this.renderInput(this.getOptions('passwordConfirm'))} */}
          {this.renderButton(signIn ? 'Login' : 'Register')}
        </form>
        <div className="sign-switch_container">
          <span onClick={this.switchLogin} className="control sign-switch">
            {!signIn ? 'Sign In' : 'Sign Up'}
          </span>
        </div>
      </div>
    );
  }
}

export default LogForm;

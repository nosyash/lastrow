import React, { Component } from 'react';
import Joi from 'joi-browser';
import Form from './Form';

class LogForm extends Form {
  state = {
    signIn: true,
    data: { username: '', password: '' },
    errors: {},
    visiblePass: false,
  };

  dataSignin = { username: '', password: '' };

  dataSignup = { ...this.dataSignin, email: '', passwordConfirm: '' };

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
    passwordConfirm: Joi.string()
      .required()
      .valid(Joi.ref('password'))
      .options({
        language: {
          any: {
            allowOnly: '!!Passwords do not match',
          },
        },
      })
      .label('Confirm password'),
  };

  schema = this.signin;

  handleSubmit = e => {
    e.preventDefault();
    console.log('submit');
  };

  switchLogin = () => {
    const { signIn, data } = this.state;
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
          {!signIn && this.renderInput(this.getOptions('passwordConfirm'))}
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

import React, { Component } from 'react';
import Form from './Form';
import * as api from '../../constants/apiActions';
import * as types from '../../constants/ActionTypes';
import http from '../../utils/httpServices';
import { connect } from 'react-redux';
import Joi from 'joi-browser';

class ProfileSettings extends Form {
  state = {
    signIn: true,
    data: { title: '', path: '' },
    errors: {},
    visiblePass: false,
  };
  render() { 
    return (  );
  }
}

const mapStateToProps = state => ({
    profile: state.Profile,
})

const mapDispatchToProps = {
    updateProfile: (payload) => ({ type: types.UPDATE_PROFILE, payload })
}
 
export default connect(mapStateToProps, mapDispatchToProps)(ProfileSettings);

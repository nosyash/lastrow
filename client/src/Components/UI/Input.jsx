/* eslint-disable jsx-a11y/label-has-for */
import React from 'react';

const Input = ({ name, error, icon, element, ...rest }) => (
  <div className="form-group">
    <span className="icon">
      <i className={`fas fa-${icon}`} />
    </span>
    <input {...rest} name={name} id={name} className="form-control form-input" />
    {error && <div className="alert alert-danger mt-1">{error}</div>}
    {element}
  </div>
);

export default Input;

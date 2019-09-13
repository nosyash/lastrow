/* eslint-disable jsx-a11y/label-has-for */
import React, { useEffect, useRef } from 'react';

const Input = ({ name, error, icon, element, classes, autoFocus, ...rest }) => {
  const inputEl = useRef(null);
  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputEl.current.focus(), 0);
    }
  }, []);
  return (
    <div className="form-group">
      <span className="icon">
        <i className={`fas fa-${icon}`} />
      </span>
      <input
        {...rest}
        ref={inputEl}
        name={name}
        id={name}
        className={`form-control form-input ${classes}`}
      />
      {error && <div className="alert alert-danger mt-1">{error}</div>}
      {element}
    </div>
  );
};

export default Input;

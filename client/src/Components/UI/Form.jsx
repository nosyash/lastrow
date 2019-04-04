import React, { Component } from 'react';
import Joi from 'joi-browser';
import Input from './Input';

class Form extends Component {
  state = {
    data: {},
    errors: {},
  };

  validate = () => {
    const { data } = this.state;
    const options = { abortEarly: true };
    const { error } = Joi.validate(data, this.schema, options);
    if (!error) return null;

    const errors = {};
    for (const item of error.details) errors[item.path[0]] = item.message;
    return errors;
  };

  validateProperty = ({ name, value }) => {
    const { signIn } = this.state;
    const obj = { [name]: value };
    const schema = { [name]: this.schema[name] };
    if (name === 'passwordConfirm' && !signIn) {
      const { data } = this.state;
      schema.password = this.schema.password;
      obj.password = data.password;
    }
    const { error } = Joi.validate(obj, schema, { abortEarly: false });
    return error ? error.details[0].message : null;
  };

  handleSubmit = e => {
    e.preventDefault();

    const errors = this.validate();
    this.setState({ errors: errors || {} });
    if (errors) return;

    this.doSubmit();
  };

  handleChange = ({ currentTarget: input }) => {
    let { errors, data } = this.state;
    errors = { ...errors };
    const errorMessage = this.validateProperty(input);
    if (errorMessage) errors[input.name] = errorMessage;
    else delete errors[input.name];

    data = { ...data };
    data[input.name] = input.value;
    this.setState({ data, errors });
  };

  renderButton = label => (
    <button type="submit" disabled={this.validate()} className="button button-submit">
      {label}
    </button>
  );

  renderInput = opts => {
    const { data, errors } = this.state;
    const { name } = opts;
    const type = opts && opts.type ? opts.type : 'text';
    const placeholder = opts && opts.placeholder ? opts.placeholder : '';
    const icon = opts && opts.icon ? opts.icon : '';
    return (
      <Input
        type={type}
        name={name}
        placeholder={placeholder}
        value={data[name]}
        onChange={this.handleChange}
        error={errors[name]}
        icon={icon}
        element={opts.element}
      />
    );
  };
}

export default Form;

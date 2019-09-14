import React, { Component, FormEvent } from 'react';
import Joi from 'joi-browser';
import Input from './Input';

interface Form {
    schema: any;
}

class Form extends Component {
    state = {
        data: {},
        errors: {},
        visiblePass: false,
    };

    validate = () => {
        const { data } = this.state;
        const options = { abortEarly: true };
        const { error } = Joi.validate(data, this.schema, options);
        if (!error) return null;

        const errors = {} as any;
        for (const item of error.details) errors[item.path[0]] = item.message;
        return errors;
    };

    validateProperty = ({ name, value }: any) => {
        const { signIn } = this.state as any;
        const obj = { [name]: value };
        const schema = { [name]: this.schema[name] };
        if (name === 'passwordConfirm' && !signIn) {
            const { data } = this.state as any;
            (schema as any).password = this.schema.password;
            (obj as any).password = data.password;
        }
        const { error } = Joi.validate(obj, schema, { abortEarly: false });
        return error ? error.details[0].message : null;
    };

    handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const errors = this.validate();
        this.setState({ errors: errors || {} });
        if (errors) return;
    };

    handleChange = ({ currentTarget: input }: any) => {
        let { errors, data } = this.state as any;
        errors = { ...errors };
        const errorMessage = this.validateProperty(input);
        if (errorMessage) errors[input.name] = errorMessage;
        else delete errors[input.name];

        data = { ...data };
        data[input.name] = input.value;
        this.setState({ data, errors });
    };

    renderEye = () => {
        const { visiblePass } = this.state;
        const handleClick = (e: any) => {
            e.preventDefault();
            const active = document.activeElement as HTMLElement;
            this.setState({ visiblePass: !visiblePass });
            active.focus();
        };

        return (
            <span onMouseDown={handleClick} className="control show-pass">
                <i className="fas fa-eye" />
            </span>
        );
    };

    renderButton = (label: string, opts = {}) => {
        const { disabled } = opts as any;
        return (
            <button
                type="submit"
                disabled={this.validate() || disabled}
                className="button button-submit"
            >
                {label}
            </button>
        );
    };

    renderInput = (opts: any) => {
        const { data, errors, visiblePass } = this.state as any;
        const { name, renderEye, autoFocus = false, classes = '' } = opts;
        let { type = 'text' } = opts;
        if (type === 'password' && visiblePass) {
            type = 'text';
        }
        if (type === 'password' && !visiblePass) {
            type = 'password';
        }

        const element = renderEye ? this.renderEye() : '';
        const placeholder = opts && opts.placeholder ? opts.placeholder : '';
        const icon = opts && opts.icon ? opts.icon : '';
        return (
            <Input
                autoFocus={autoFocus}
                type={type}
                name={name}
                classes={classes}
                placeholder={placeholder}
                value={data[name]}
                onChange={this.handleChange}
                error={errors[name]}
                icon={icon}
                element={element}
            />
        );
    };
}

export default Form;

import React from 'react';
import { connect } from 'react-redux';
import Joi from 'joi-browser';
import * as types from '../../constants/actionTypes';
import Form from '../Form';
import { GUEST_AUTH } from '../../constants';

interface GuestAuthState {
    data: any;
    errors: any;
}

class GuestAuth extends Form {

    state = {
        data: { name: '' },
        errors: {},
    } as any;

    schema = {
        name: Joi.string()
            .required()
            .min(1)
            .max(15)
            .label('Name'),
    };

    handleSubmit = e => {
        e.preventDefault();
        const { updateProfile, removePopup } = this.props as any;
        const { data } = this.state;
        updateProfile({ name: data.name, logged: true });

        removePopup(GUEST_AUTH);
        this.sendEvent();
    };

    handleClose = () => {
        const { updateProfile, removePopup } = this.props as any;
        updateProfile({ name: 'Guest', logged: true, guest: true });

        removePopup(GUEST_AUTH);
        this.sendEvent();
    };

    sendEvent = () => {
        const e = new Event('logged');
        document.dispatchEvent(e);
    };

    render() {
        return (
            <RenderForm
                handleSubmit={this.handleSubmit}
                renderInput={this.renderInput}
                renderButton={this.renderButton}
                onClose={this.handleClose}
            />
        );
    }
}

const RenderForm = props => {
    const { handleSubmit, renderInput, renderButton, onClose } = props;
    const inputOpts = {
        name: 'name',
        icon: 'user',
        autoFocus: true,
        placeholder: 'Name',
    };
    return (
        <div className="popup-element guest-auth_container">
            <h1 className="title">Enter nickname</h1>
            <form onSubmit={handleSubmit}>
                {renderInput(inputOpts)}
                <div className="controls-container">
                    {renderButton('Save')}
                    <button onClick={onClose} type="button" className="button button-cancel">
                        Skip
                    </button>
                </div>
            </form>
        </div>
    );
};

const mapStateToProps = state => ({
    profile: state.profile,
});

const mapDispatchToProps = {
    updateProfile: payload => ({ type: types.UPDATE_PROFILE, payload }),
    removePopup: payload => ({ type: types.REMOVE_POPUP, payload }),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(GuestAuth);

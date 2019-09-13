import React from 'react';
import Joi from 'joi-browser';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import Form from '../Form';
import http from '../../../utils/httpServices';
import * as api from '../../../constants/apiActions';
import * as types from '../../../constants/ActionTypes';

class NewRoom extends Form {
    state = {
        signIn: true,
        data: { title: '', path: '' },
        errors: {},
        visiblePass: false,
    };

    schema = {
        title: Joi.string()
            .required()
            .max(20)
            .min(4)
            .label('Title'),
        path: Joi.string()
            .required()
            .max(15)
            .min(4)
            .label('Path'),
    };

    handleSubmit = async e => {
        const { title, path } = this.state.data;
        const { id, history, removePopup } = this.props;
        e.preventDefault();
        const res = await http.post(api.API_ROOMS(), api.ROOM_CREATE(title, path));
        if (!res.status) {
            return;
        }
        removePopup(id);
        history.push(`/r/${path}`);
    };

    handleClose = () => {
        const { id, removePopup } = this.props;
        removePopup(id);
    };

    render() {
        const { onSubmit, id } = this.props;
        return (
            <RenderForm
                onSubmit={onSubmit}
                id={id}
                onClose={this.handleClose}
                handleSubmit={this.handleSubmit}
                renderButton={this.renderButton}
                renderInput={this.renderInput}
            />
        );
    }
}

const RenderForm = ({ handleSubmit, renderInput, renderButton }) => (
    <div className="popup-element room-creation_container">
        <form onSubmit={handleSubmit}>
            {renderInput({ name: 'title', icon: 'info', placeholder: 'Title' })}
            {renderInput({ name: 'path', icon: 'link', placeholder: 'Path' })}
            <div className="controls-container">{renderButton('Create')}</div>
        </form>
    </div>
);

const mapDispatchToProps = {
    updateProfile: payload => ({ type: types.UPDATE_PROFILE, payload }),
    removePopup: payload => ({ type: types.REMOVE_POPUP, payload }),
};

export default connect(
    null,
    mapDispatchToProps
)(withRouter(NewRoom));

// export default withRouter(NewRoom);

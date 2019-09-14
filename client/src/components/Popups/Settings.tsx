/* eslint-disable jsx-a11y/label-has-for */
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { set, get as lsGet } from 'local-storage';
import * as types from '../../constants/actionTypes';

// TODO: Extremely poorly made. Refactor!

function ProfileSettings(props) {
    const [notify, setNotify] = useState(lsGet('notify') || false);

    function onNotificationChange() {
        const isPermissionDefault = Notification.permission === 'default';
        if (isPermissionDefault) Notification.requestPermission();
        set('notifications-requested', true);
        set('notify', !notify);
        setNotify(!notify);
    }

    return (
        <div className="popup-element settings_container">
            <input
                name="notification"
                id="notification"
                title="Get desktop notifications when quoted"
                className="option-checkbox"
                type="checkbox"
                value={notify}
                checked={notify}
                onChange={onNotificationChange}
            />
            <label
                className="option-label"
                htmlFor="notification"
                title="Get desktop notifications when quoted"
            >
                Desktop notifications
            </label>
        </div>
    );
}

const mapStateToProps = state => ({
    profile: state.profile,
});

const mapDispatchToProps = {
    updateProfile: payload => ({ type: types.UPDATE_PROFILE, payload }),
    removePopup: payload => ({ type: types.REMOVE_POPUP, payload }),
    addPopup: payload => ({ type: types.ADD_POPUP, payload }),
    togglePopup: payload => ({ type: types.TOGGLE_POPUP, payload }),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ProfileSettings);

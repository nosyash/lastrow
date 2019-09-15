/* eslint-disable jsx-a11y/label-has-for */
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { set, get as lsGet } from 'local-storage';
import * as types from '../../../constants/actionTypes';
import SettingsMenu from './components/SettingsMenu'
import './style.less'

const items = [
    {
        title: 'User Settings',
        children: [
            { name: 'Account' },
            { name: 'Appearance' }
        ]
    },
    {
        title: 'Room settings',
        children: [
            { name: 'Emotes' },
            { name: 'Roles' },
            { name: 'Logs' }
        ]
    }
]

interface ProfileSettings {
    updateProfile: (payload: any) => void;
}

function ProfileSettings(props: ProfileSettings) {
    const [active, setActive] = useState('Account')
    return (
        <div className="popup-element settings-container">
            <SettingsMenu list={items} active={active} onClick={name => setActive(name)} />

        </div>
    );
}

const mapStateToProps = state => ({
    profile: state.profile,
});

const mapDispatchToProps = {
    updateProfile: (payload: any) => ({ type: types.UPDATE_PROFILE, payload }),
    removePopup: (payload: any) => ({ type: types.REMOVE_POPUP, payload }),
    addPopup: (payload: any) => ({ type: types.ADD_POPUP, payload }),
    togglePopup: (payload: any) => ({ type: types.TOGGLE_POPUP, payload }),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ProfileSettings);

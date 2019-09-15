/* eslint-disable jsx-a11y/label-has-for */
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { set, get as lsGet } from 'local-storage';
import * as types from '../../../constants/actionTypes';
import SettingsMenu from './components/SettingsMenu'
import SettingsScenes from './scenes/index'
import './style.less'

const _items = [
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
    roomID: string;
}

function ProfileSettings(props: ProfileSettings) {
    const [active, setActive] = useState('Account')
    const [items, setItems] = useState(_items);

    useEffect(() => {
        if (!props.roomID)
            setItems([_items[0]])
        else
            setItems(_items)
    }, [props.roomID])

    return (
        <div className="popup-element settings-container">
            <SettingsMenu list={items} active={active} onClick={name => setActive(name)} />
            <SettingsScenes active={active} />
        </div>
    );
}


const mapStateToProps = state => ({
    profile: state.profile,
    roomID: state.mainStates.roomID,
});
const mapDispatchToProps = {
    updateProfile: (payload: any) => ({ type: types.UPDATE_PROFILE, payload }),
};
export default connect(mapStateToProps, mapDispatchToProps)(ProfileSettings);

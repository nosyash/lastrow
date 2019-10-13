import React, { useState, useEffect } from 'react';
import { connect, useSelector } from 'react-redux';
import { set, get as lsGet } from 'local-storage';
import * as types from '../../../constants/actionTypes';
import SettingsMenu from './components/SettingsMenu'
import SettingsScenes from './scenes/index'
import './style.less'
import { Profile } from '../../../reducers/profile';
import { isPermit } from '../../../utils';
import { Permissions } from '../../../reducers/rooms';

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

    const level = useSelector((state: any) => (state.profile as Profile).currentLevel)
    const perms = useSelector((state: any) => state.rooms.currentPermissions) as Permissions
    const permit = isPermit(level)

    const canChangeRoomSettings = permit(perms.room_update.add_emoji)

    useEffect(() => {
        if (!props.roomID || !canChangeRoomSettings) {
            setItems([_items[0]])
        } else {
            setItems(_items)
        }
    }, [props.roomID])

    return (
        <div className="popup-element u-mobile-flex">
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

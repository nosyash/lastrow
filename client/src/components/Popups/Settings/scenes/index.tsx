import React from 'react';
import { connect } from 'react-redux';
import * as types from '../../../../constants/actionTypes';
import ProfileSettings from './ProfileSettings';

interface SettingsScenesProps {
    active: string;
}



function SettingsScenes({ active }: SettingsScenesProps) {
    return (
        <div className="settings-scenes">
            {active === 'Account' && <ProfileSettings />}
        </div>
    );
}

const mapStateToProps = state => ({ profile: state.profile, });
const mapDispatchToProps = {
    updateProfile: (payload: any) => ({ type: types.UPDATE_PROFILE, payload }),
};
export default connect(mapStateToProps, mapDispatchToProps)(SettingsScenes);

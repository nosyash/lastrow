import { store } from '../store';
import { Profile } from '../reducers/profile';
import { get } from 'lodash'
import { Permissions } from '../reducers/rooms';
import { DEBUG_GRANT_ALL_PERMISSIONS } from '../constants';

export const isPermit = (action: string): boolean => {
    if (DEBUG_GRANT_ALL_PERMISSIONS) {
        return true
    }

    const { currentLevel } = store.getState().profile as Profile;
    const roomPermissions = store.getState().rooms.currentPermissions as Permissions;

    const actionLevel = get(roomPermissions, action)
    return currentLevel >= actionLevel;
}
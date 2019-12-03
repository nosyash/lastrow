import { store } from '../store';
import { Profile } from '../reducers/profile';
import { get } from 'lodash'
import { Permissions } from '../reducers/rooms';

export const isPermit = (action: string): boolean => {
    const { currentLevel } = store.getState().profile as Profile;
    const roomPermissions = store.getState().rooms.currentPermissions as Permissions;

    const actionLevel = get(roomPermissions, action)
    return currentLevel >= actionLevel;
}
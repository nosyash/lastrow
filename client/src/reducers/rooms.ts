/* eslint-disable @typescript-eslint/camelcase */
import * as types from '../constants/actionTypes';
import { Room } from '../utils/types';

export enum PermissionsMap {
    Guest,
    User,
    PlaylistManager,
    Moderator,
    SeniorModerator,
    Coowner,
    Owner,
}

export interface RoomUpdatePermissions {
    change_title: PermissionsMap;
    change_path: PermissionsMap;
    add_emoji: PermissionsMap;
    del_emoji: PermissionsMap;
    subtitles_offset: PermissionsMap;
    change_emoji_name: PermissionsMap;
    add_role: PermissionsMap;
    change_permission: PermissionsMap;
}

export interface PlaylistEventPermissions {
    playlist_add: PermissionsMap;
    playlist_del: PermissionsMap;
    move: PermissionsMap;
}

export interface PlayerEventPermissions {
    pause: PermissionsMap;
    resume: PermissionsMap;
    rewind: PermissionsMap;
}

export interface UserEventPermissions {
    message: PermissionsMap;
    kick: PermissionsMap;
    ban: PermissionsMap;
    unban: PermissionsMap;
}

export interface Permissions {
    room_update: RoomUpdatePermissions;
    playlist_event: PlaylistEventPermissions;
    player_event: PlayerEventPermissions;
    user_event: UserEventPermissions;
}


const DefaultPermissions = {
    room_update: {
        change_title: 4,
        change_path: 4,
        add_emoji: 4,
        del_emoji: 4,
        subtitles_offset: 4,
        change_emoji_name: 4,
        add_role: 3,
        change_permission: 4
    },
    playlist_event: {
        playlist_add: 1,
        playlist_del: 2,
        move: 2
    },
    player_event: {
        pause: 2,
        resume: 2,
        rewind: 2
    },
    user_event: {
        message: 0,
        kick: 3,
        ban: 3,
        unban: 3,
    }
} as Permissions;

export interface Rooms {
    list: Room[];
    currentPermissions: Permissions;
}

const InitialState = {
    list: [] as Room[],
    currentPermissions: DefaultPermissions,
} as Rooms;

const Rooms = (state = InitialState, action: any) => {
    if (action.type === types.UPDATE_ROOMLIST) {
        return { list: action.payload };
    }

    if (action.type === types.SET_PERMISSIONS) {
        return { ...state, currentPermissions: { ...state.currentPermissions, ...action.payload }}
    }

    return state;
};

export default Rooms;

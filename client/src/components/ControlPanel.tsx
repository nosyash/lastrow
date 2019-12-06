import React, { useState, useRef } from 'react';
import { connect } from 'react-redux';
import * as types from '../constants/actionTypes';
import { PLAYLIST, SETTINGS, CONTROL_PANEL_EXPAND_DELAY, CONTROL_PANEL_COLLAPSE_DELAY } from '../constants';
import { Video } from '../utils/types';
import { State } from '../reducers';
import { Media } from '../reducers/media';
import { Profile } from '../reducers/profile';
import './ControlPanel.less'
import cn from 'classnames'
import { dispatchCustomEvent } from '../utils';
import { isPermit } from '../utils/storeUtils';

type ControlPanelProps = MapState & MapDispatch & {
}

function ControlPanel(props: ControlPanelProps) {
    const [collapsed, setCollapsed] = useState(props.cinemaMode)
    const timer = useRef(null)

    function handleClick(id: string) {
        if (id === 'showPlaylist') props.togglePopup(PLAYLIST);
    }

    const delayedExpand = () => {
        // if (!props.cinemaMode) return

        // clearTimeout(timer.current)
        // timer.current = setTimeout(() => setCollapsed(false), CONTROL_PANEL_EXPAND_DELAY);
    }

    const delayedCollapse = () => {
        // if (!props.cinemaMode) return

        // clearTimeout(timer.current)
        // timer.current = setTimeout(() => setCollapsed(true), CONTROL_PANEL_COLLAPSE_DELAY);
    }

    const toggleCollapse = () => {
        setCollapsed(!collapsed)
    }

    const { profile, playlist } = props;
    const upNext = playlist[1];
    const { logged } = profile;
    const classes = cn(['control-panel', { 'control-panel--expanded': !collapsed,  'control-panel--collapsed': collapsed }])
    const itemsClasses = cn([
        'control-panel__collapsible-items',
        { 'control-panel__collapsible-items--collapsed': collapsed }
    ])

    const controlsProps: ControlsProps = {
        cinemaMode: props.cinemaMode,
        toggleSync: props.toggleSync,
        isSynced: props.isSynced,
        hasVideo: props.hasVideo,
        toggleCinemaMode: props.toggleCinemaMode,
        remotePlaying: props.remotePlaying,
    }

    return (
        <div onMouseLeave={delayedCollapse} className={classes}>
            {/* {props.cinemaMode && ( */}
            <div onClick={toggleCollapse} onMouseEnter={delayedExpand} className="control-panel__expander">
                <i className={`fa fa-angle-up`} />
            </div>
            {/* )} */}
            <div className={itemsClasses}>
                <Controls {...controlsProps} />
                <PlaylistInfo upNext={upNext} logged={logged} onClick={handleClick} />
                <div className="divider" />
                {logged && (
                    <RenderProfile
                        logged={logged}
                        onSettings={() => props.togglePopup(SETTINGS)}
                        profile={profile}
                    />
                )}
            </div>
        </div>
    );
}

const getUpNextUrl = (upnext: Video) => upnext ? upnext.url : '';
const getUpNextTitle = (upnext: Video) => upnext ? upnext.title || upnext.url : '';

interface ControlsProps {
    remotePlaying: boolean;
    hasVideo: boolean;
    cinemaMode: boolean;
    isSynced: boolean;
    toggleCinemaMode: () => void;
    toggleSync: () => void;
}

export interface ControlPanelEvent {
    toggleRemotePlayback?: boolean;
    remotelyRewind?: boolean;
}

const Controls = (props: ControlsProps) => {
    function dispatchControlEvent(details = {} as ControlPanelEvent): boolean {
        return dispatchCustomEvent('controlPanelEvent', details)
    }

    const toggleRemotePlaybackStatus = () => dispatchControlEvent({ toggleRemotePlayback: true })
    const remotelyRewindAtCurrentTime = () => dispatchControlEvent({ remotelyRewind: true })

    return (
        <div className={cn('panel-controls')}>
            <RenderDefaultControls />
            <RenderAdminControls />
        </div>
    )
    
    function RenderDefaultControls() {
        const syncTitle = 'Toggle synchronization'
        const cinemaModeTitle = 'Toggle cinema mode'
        
        return (
            <div className={cn('panel-controls__container', 'panel-controls__container--default')}>
                <div
                    title={cinemaModeTitle}
                    onClick={props.toggleCinemaMode}
                    className={cn('panel-controls__control', 'panel-controls__control--cinema-mode', { 'panel-controls--highlight': props.cinemaMode })}
                >
                    <i className="fa fa-film" />
                </div>
                {props.hasVideo && <div
                    title={syncTitle}
                    onClick={props.toggleSync}
                    className={cn(['panel-controls__control', 'panel-controls__control--sync', { 'panel-controls--highlight': props.isSynced }])}
                >
                    <i className="fa fa-sync" />
                </div>}
            </div>
        )
    }

    function RenderAdminControls() {
        const canPause = isPermit('player_event.pause')
        const canResume = isPermit('player_event.resume')
        const canRewind = isPermit('player_event.rewind')

        if (!props.hasVideo || (!canPause && !canResume && !canRewind)) {
            return null
        }

        const playbackClasses = cn('fa', props.remotePlaying ? 'fa-pause' : 'fa-play')
        const playbackTitle = props.remotePlaying ? 'Remotely pause the video' : 'Remotely resume the video'

        const rewindClasses = cn('fa', 'fa-forward')
        const rewindTitle = 'Remotely rewind at current time'
        
        return (
            <div className={cn('panel-controls__container', 'panel-controls__container--default')}>
                {props.hasVideo && canResume && canPause && (
                    <div onClick={toggleRemotePlaybackStatus} title={playbackTitle} className="panel-controls__control">
                        <i className={playbackClasses} />
                    </div>
                )}
                {props.hasVideo && canRewind && (
                    <div onClick={remotelyRewindAtCurrentTime} title={rewindTitle} className="panel-controls__control">
                        <i className={rewindClasses} />
                    </div>
                )}
            </div>
        )
    }

}

const PlaylistInfo = ({ onClick, upNext }: any) => (
    <div className="playlister">
        <RenderItem
            dataId="showPlaylist"
            onClick={onClick}
            classes="control-svg show-playlist-icon"
            text="Playlist"
        />
        <div style={{ visibility: upNext ? 'visible' : 'hidden' }} className="item">
            <div className="up-nexts-sign">Up next: </div>
            <a
                className="control"
                target="_blank"
                title={getUpNextTitle(upNext)}
                rel="noopener noreferrer"
                href={getUpNextUrl(upNext)}
            >
                {getUpNextTitle(upNext)}
            </a>
            {/* <i className="fa fa-arrow-right" /> */}
        </div>
    </div>
);

const RenderItem = ({ classes, onClick, dataId, text }: any) => (
    <div>
        <span onClick={() => onClick(dataId)} className="control item">
            <span className={classes} />
            {text}
        </span>
    </div>
);

const RenderProfile = ({ profile, onSettings }: any) => {
    const { name, image, color, guest } = profile;
    const backgroundColor = color;
    const backgroundImage = `url(${image})`;
    return (
        <div className="mini-profile">
            <div style={{ backgroundColor, backgroundImage }} className="chat-avatar" />
            <div className="mini-profile_second-section">
                <span style={{ color }} className="chat-name">
                    {name}
                </span>
                {!guest && (
                    <div className="controls-container">
                        <span onClick={onSettings} className="control">
                            <i className="fas fa-cog" />
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};


interface MapState {
    profile: Profile;
    playlist: Media['playlist'];
    remotePlaying: boolean;
    cinemaMode: boolean;
    hasVideo: boolean;
    isSynced: boolean;
}
interface MapDispatch {
    togglePopup: (name: string) => void;
    toggleCinemaMode: () => void;
    toggleSync: () => void;
}

const mapStateToProps = (state: State) => ({
    profile: state.profile,
    playlist: state.media.playlist,
    hasVideo: !!state.media.playlist[0],
    isSynced: state.media.isSynced,
    remotePlaying: state.media.remotePlaying,
    cinemaMode: state.mainStates.cinemaMode,
});

const mapDispatchToProps = {
    togglePopup: (payload: string) => ({ type: types.TOGGLE_POPUP, payload }),
    toggleCinemaMode: () => ({ type: types.TOGGLE_CINEMAMODE }),
    toggleSync: () => ({ type: types.TOGGLE_SYNC }),
};

export default connect<MapState, typeof mapDispatchToProps>(
    mapStateToProps,
    mapDispatchToProps
)(ControlPanel);

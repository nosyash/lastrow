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

type ControlPanelProps = MapState & MapDispatch & {
    cinemaMode: boolean;
}

function ControlPanel(props: ControlPanelProps) {
    const [collapsed, setCollapsed] = useState(props.cinemaMode)
    const timer = useRef(null)

    function handleClick(id: string) {
        if (id === "showPlaylist") props.togglePopup(PLAYLIST);
    }

    const delayedExpand = () => {
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCollapsed(false), CONTROL_PANEL_EXPAND_DELAY);
    }

    const delayedCollapse = () => {
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCollapsed(true), CONTROL_PANEL_COLLAPSE_DELAY);
    }

    const { profile, playlist } = props;
    const upNext = playlist[1];
    const { logged } = profile;
    const classes = cn(["control-panel_container", { "control-panel_container--expanded": !collapsed }])
    const itemsClasses = cn(["control-panel__collapsible-items", { "control-panel__collapsible-items--collapsed": collapsed }])
    return (
        <div onMouseLeave={delayedCollapse}  className={classes}>
            <div onMouseEnter={delayedExpand} className="control-panel__expander">
                <i className={`fa fa-angle-up`} />
            </div>
            <div className={itemsClasses}>
                <RenderPlaylister upNext={upNext} logged={logged} onClick={handleClick} />
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

const RenderPlaylister = ({ onClick, logged, upNext }: any) => (
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

const getUpNextUrl = (upnext: Video) => upnext ? upnext.url : '';
const getUpNextTitle = (upnext: Video) => upnext ? upnext.title || upnext.url : '';

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
    playlist: Media['playlist']
}
interface MapDispatch {
    togglePopup: (name: string) => void;
}

const mapStateToProps = (state: State) => ({
    profile: state.profile,
    playlist: state.media.playlist,
});

const mapDispatchToProps = {
    togglePopup: (payload: string) => ({ type: types.TOGGLE_POPUP, payload }),
};

export default connect<MapState, typeof mapDispatchToProps>(
    mapStateToProps,
    mapDispatchToProps
)(ControlPanel);

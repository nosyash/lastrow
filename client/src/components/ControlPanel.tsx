import React from 'react';
import { connect } from 'react-redux';
import * as types from '../constants/actionTypes';
import { PROFILE_SETTINGS, PLAYLIST, SETTINGS } from '../constants';
import { Video } from '../utils/types';

function ControlPanel(props: any) {
    function handleClick(id: string) {
        switch (id) {
            case 'showPlaylist':
                return props.togglePopup(PLAYLIST);

            default:
                break;
        }
    }

    const { profile, playlist } = props;
    const upNext = playlist[1];
    const { logged } = profile;
    return (
        <div className="control-panel_container">
            <RenderPlaylister upNext={upNext} logged={logged} onClick={handleClick} />
            <div className="divider" />
            {logged && (
                <RenderProfile
                    logged={logged}
                    onProfileSettings={() => props.addPopup(PROFILE_SETTINGS)}
                    // onSettings={() => props.addPopup(SETTINGS)}
                    profile={profile}
                />
            )}
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

const getUpNextUrl = (upnext: Video) => {
    if (upnext) return upnext.url;
    return '';
};

const getUpNextTitle = (upnext: Video) => {
    if (!upnext) return '';
    if (upnext.title) return upnext.title;
    if (upnext.url) return upnext.url;
};

const RenderItem = ({ classes, onClick, dataId, text }: any) => (
    <div>
        <span onClick={() => onClick(dataId)} className="control item">
            <span className={classes} />
            {text}
        </span>
    </div>
);

const RenderProfile = ({ profile, onProfileSettings, onSettings }: any) => {
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
                        <span onClick={onProfileSettings} className="control">
                            <i className="fas fa-users-cog" />
                        </span>
                        <span onClick={onSettings} className="control">
                            <i className="fas fa-cog" />
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const mapStateToProps = (state: any) => ({
    profile: state.profile,
    playlist: state.media.playlist,
});

const mapDispatchToProps = {
    addPopup: (payload: string) => ({ type: types.ADD_POPUP, payload }),
    togglePopup: (payload: string) => ({ type: types.TOGGLE_POPUP, payload }),
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ControlPanel);

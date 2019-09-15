import React, { Component, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { formatTime } from '../../utils';
import { webSocketSend } from '../../actions';
import * as api from '../../constants/apiActions';
import AddMedia from './AddMedia';
import { Video } from '../../utils/types';

interface PlaylistProps {
    uuid: string;
    playlist: Video[]
}

class Playlist extends Component<PlaylistProps> {

    handleDelete = ({ __id }) => {
        const { uuid } = this.props;
        webSocketSend(api.DELETE_VIDEO_FROM_PLAYLIST({ __id, uuid }));
    };

    render() {
        const { playlist } = this.props;
        return (
            <div className="popup-element playlist_container">
                {<AddMedia />}
                {!!playlist.length && (
                    <div className="playlist_inner">
                        {playlist.map(element =>
                            <PlaylistElement
                                element={element}
                                key={element.__id}
                                onDelete={() => this.handleDelete(element)}
                            />
                        )}
                    </div>
                )}
            </div>
        );
    }
}

function PlaylistElement({ element, onDelete }) {
    const [deleted, setDeleted] = useState(false);
    const handleDelete = () => {
        if (!deleted) {
            onDelete();
            // setDeleted(true);
        }
    }
    // if (deleted) return null;
    return (
        <div className="paylist-item">
            <a className="control" target="_blank" rel="noopener noreferrer" href={element.url}>
                {element.title || element.url}
            </a>
            <span className="playlist-item__duration">{formatTime(element.duration)}</span>
            <span
                onClick={handleDelete}
                className="control playlist-item__remove-icon"
            >
                <i className="fa fa-times" />
            </span>
        </div>
    )
}

const mapStateToProps = state => ({
    playlist: state.media.playlist,
    uuid: state.profile.uuid,
});

export default connect(mapStateToProps)(Playlist);

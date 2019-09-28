import React, { Component, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { formatTime } from '../../utils';
import { webSocketSend } from '../../actions';
import * as api from '../../constants/apiActions';
import AddMedia from './AddMedia';
import { Video } from '../../utils/types';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';


interface PlaylistProps {
    uuid: string;
    guest: boolean;
    playlist: Video[]
}

const SortableItem = SortableElement(({ element, handleDelete, deletable }) =>
    <PlaylistElement deletable={deletable} element={element} onDelete={() => handleDelete(element)} />);

const SortableList = SortableContainer(({ items, handleDelete, deletable }) => {
    return (
        <ul>
            {!!items && items.map((element, index) => (
                <SortableItem
                    deletable={deletable}
                    disabled={!deletable}
                    handleDelete={handleDelete}
                    index={index}
                    key={`item-${element.__id}`} element={element}
                />
            ))}
        </ul>
    );
});

class Playlist extends Component<PlaylistProps> {
    currentlyMoving: Video;
    handleDelete = ({ __id }) => {
        const { uuid } = this.props;
        webSocketSend(api.DELETE_VIDEO_FROM_PLAYLIST({ __id, uuid }));
    };

    onSortEnd = ({ newIndex }) => {
        const __id = this.currentlyMoving.__id;
        webSocketSend(api.REORDER_MEDIA({ __id, index: newIndex }));
    }

    onSortStart = ({ node }) => {
        const dataSet = (node as HTMLElement).dataset.video;
        this.currentlyMoving = JSON.parse(dataSet) as Video;
    }

    render() {
        const { playlist, guest } = this.props;
        return (
            <div className="popup-element playlist_container">
                {<AddMedia />}
                <SortableList distance={2}
                    transitionDuration={100}
                    items={playlist}
                    deletable={!guest}
                    handleDelete={this.handleDelete}
                    onSortStart={this.onSortStart}
                    onSortEnd={this.onSortEnd}
                />
                {/* {!!playlist.length && (
                    <div className="playlist_inner">
                        {playlist.map(element =>
                            <PlaylistElement
                                element={element}
                                key={element.__id}
                                onDelete={() => this.handleDelete(element)}
                            />
                        )}
                    </div>
                )} */}
            </div>
        );
    }
}

function PlaylistElement({ element, onDelete, deletable }) {
    const [deleted, setDeleted] = useState(false);
    const handleDelete = () => {
        if (!deleted) {
            onDelete();
            setDeleted(true);
        }
    }
    if (deleted) return null;
    return (
        <div data-video={JSON.stringify(element)} className="paylist-item">
            <a className="control" target="_blank" rel="noopener noreferrer" href={element.url}>
                {element.title || element.url}
            </a>
            <span className="playlist-item__duration">{formatTime(element.duration)}</span>
            <span
                hidden={!deletable}
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
    guest: state.profile.guest,
    uuid: state.profile.uuid,
});

export default connect(mapStateToProps)(Playlist);

import React, { Component, useState } from 'react';
import { connect } from 'react-redux';
import { formatTime } from '../../utils';
import { webSocketSend } from '../../actions';
import * as api from '../../constants/apiActions';
import AddMedia from './AddMedia';
import { Video } from '../../utils/types';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { State } from '../../reducers';
import { isPermit } from '../../utils/storeUtils';


interface PlaylistProps {
    uuid: string;
    guest: boolean;
    playlist: Video[];
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
        const { playlist } = this.props;        
        return (
            <div className="popup-element playlist_container">
                {<AddMedia />}
                <SortableList distance={isPermit('playlist_event.move') ? 2 : 10000}
                    transitionDuration={100}
                    items={playlist}
                    deletable={isPermit('playlist_event.playlist_del')}
                    handleDelete={this.handleDelete}
                    onSortStart={this.onSortStart}
                    onSortEnd={this.onSortEnd}
                />
            </div>
        );
    }
}

function PlaylistElement({ element, onDelete, deletable }) {
    const [deleted, setDeleted] = useState(false);

    const liveStream = element.live_stream;
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
            {!liveStream && <span className="playlist-item__duration">{formatTime(element.duration)}</span>}
            {liveStream && <span className="playlist-item__duration">LIVE</span>}
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

const mapStateToProps = (state: State) => ({
    playlist: state.media.playlist,
    guest: state.profile.guest,
    uuid: state.profile.uuid,
});

export default connect(mapStateToProps)(Playlist);

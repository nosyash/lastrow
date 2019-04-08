import React, { Component } from 'react';
import { connect } from 'react-redux';
import RoomItem from './RoomItem';
import http from '../../utils/httpServices';

import * as types from '../../constants/ActionTypes';
import * as api from '../../constants/apiActions';
import { API_FETCH_TIMEOUT } from '../../constants';
import LogForm from '../UI/LogForm';

class RoomListBase extends Component {
  state = {
    connected: false,
  };

  async componentDidMount() {
    const { clearPopups } = this.props;
    clearPopups();
    this.getRoomList();
  }

  getRoomList = async () => {
    const { UpdateRoomList } = this.props;
    const url = api.API_ROOMS();
    await http
      .get(url)
      .then(res => {
        UpdateRoomList(res.data.rooms);
        this.setState({ connected: true });
      })
      .catch(res => setTimeout(() => this.getRoomList(), API_FETCH_TIMEOUT));
  };

  render() {
    const { rooms } = this.props;
    const { connected } = this.state;
    return (
      <RenderList
        getRoomList={this.getRoomList}
        rooms={rooms}
        connected={connected}
      />
    );
  }
}

const RenderList = ({ rooms, connected, getRoomList }) => (
  <div className="main-page">
    <div className="main-page_item sign">
      <LogForm onRoomsUpdate={getRoomList} />
    </div>
    <div className="main-page_item room-list">
      <div className="room-list_contaier">
        <div className="room-list_inner">
          {rooms &&
            rooms.map((room, index) => (
              <RoomItem
                key={index}
                title={room.title}
                movie={room.play}
                users={room.users}
                link={`/r/${room.path}`}
              />
            ))}
          {!connected && (
            <div className="ml-auto mr-auto spinner-grow" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const mapStateToProps = state => ({ rooms: state.Rooms.list });

const mapDispatchToProps = {
  UpdateRoomList: payload => ({ type: types.UPDATE_ROOMLIST, payload }),
  clearPopups: () => ({ type: types.CLEAR_POPUPS }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomListBase);

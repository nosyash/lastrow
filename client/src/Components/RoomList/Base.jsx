import React, { Component } from 'react';
import { connect } from 'react-redux';
import RoomItem from './RoomItem';
import http from '../../utils/httpServices';

import * as types from '../../constants/ActionTypes';
import { API_ENDPOINT, API_FETCH_TIMEOUT } from '../../constants';

class RoomListBase extends Component {
  state = {
    connected: false,
  };

  async componentDidMount() {
    this.getRoomList();
  }

  getRoomList = async () => {
    const { UpdateRoomList } = this.props;
    const url = `${API_ENDPOINT}/rooms`;
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
      <div className="room-list">
        {rooms &&
          rooms.map((r, i) => (
            <RoomItem
              key={i}
              title={r.roomid.title}
              movie={r.play}
              users={r.users}
              link={`/r/${r.roomid.path}`}
            />
          ))}
        {!connected && (
          <div className="ml-auto mr-auto spinner-grow" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        )}
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  UpdateRoomList: payload => {
    dispatch({ type: types.UPDATE_ROOMLIST, payload });
  },
});

const mapStateToProps = state => ({ rooms: state.Rooms.list });

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RoomListBase);

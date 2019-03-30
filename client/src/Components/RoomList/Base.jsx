import React, { Component } from 'react';
import { connect } from 'react-redux';
import RoomItem from './RoomItem';
import http from '../../utils/httpServices';

import * as types from '../../constants/ActionTypes';
import { API_ENDPOINT } from '../../constants';

class RoomListBase extends Component {
  async componentDidMount() {
    const { UpdateRoomList } = this.props;

    const { data } = await http.get(API_ENDPOINT);
    UpdateRoomList(data.rooms);
  }

  render() {
    const { rooms } = this.props;
    return (
      <div className="room-list">
        {rooms &&
          rooms.map((r, i) => (
            <RoomItem
              key={i}
              title={r.title}
              movie={r.play}
              users={r.users}
              link={`/r/${r.path}`}
            />
          ))}
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

import React, { Component, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import RoomItem from './RoomItem';
import http from '../../utils/httpServices';

import * as types from '../../constants/ActionTypes';
import * as api from '../../constants/apiActions';
import { API_FETCH_TIMEOUT } from '../../constants';
import LogForm from '../UI/Popups/LogForm';

function RoomListBase(props) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    props.clearPopups();
    getRoomList();
  }, []);

  async function getRoomList() {
    const { UpdateRoomList } = props;
    const url = api.API_ROOMS();
    await http
      .get(url)
      .then(res => {
        UpdateRoomList(res.data.rooms);
        setConnected(true);
      })
      .catch(() => {
        setTimeout(getRoomList, API_FETCH_TIMEOUT);
      });
  }

  const { rooms, history } = props;
  return (
    <RenderList
      getRoomList={getRoomList}
      rooms={rooms}
      history={history}
      connected={connected}
    />
  );
}

const RenderList = ({ rooms, connected, getRoomList, history }) => (
  <div className="main-page">
    <div className="main-page_item sign">
      <LogForm onRoomsUpdate={getRoomList} />
    </div>
    <div className="main-page_item room-list">
      <div className="room-list_contaier">
        <div className="room-list_inner">
          <div className="custom-table custom-table_head">
            <div className="custom-table_head_item">Channel</div>
            <div className="custom-table_head_item">Connected</div>
            <div className="custom-table_head_item">Playing</div>
          </div>
          <div className="custom-table custom-table_items">
            {rooms &&
              rooms.map((room, index) => (
                <RoomItem
                  history={history}
                  key={index}
                  title={room.title}
                  movie={room.play}
                  users={room.users}
                  link={`/r/${room.path}`}
                />
              ))}
          </div>
          {!connected && (
            <div
              style={{ marginTop: 50, width: '3rem', height: '3rem' }}
              className="ml-auto mr-auto spinner-grow"
              role="status"
            >
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

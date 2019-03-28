import React, { Component } from 'react';
import RoomItem from './RoomItem';

class RoomListBase extends Component {
  state = {};

  render() {
    return (
      <div className="room-list">
        <RoomItem title="movie1" movie="wjsn" users="5" link="/r/movie1" />
        <RoomItem title="movie2" movie="wjsn" users="5" link="/r/movie2" />
        <RoomItem title="movie3" movie="wjsn" users="5" link="/r/movie3" />
      </div>
    );
  }
}

export default RoomListBase;

import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class RoomItem extends Component {
  state = {};

  // render() {
  //   const { title, movie, users, link } = this.props;
  //   return (
  //     <Link to={link} className="room-item">
  //       <h2 className="room-item_title">{title}</h2>
  //       <p className="room-item_movie">
  //         <i className="fa fa-film" />
  //         {movie}
  //       </p>
  //       <p className="room-item_users">
  //         <i className="fa fa-user" />
  //         {users}
  //       </p>
  //     </Link>
  //   );
  // }

  render() {
    const { title, movie, users, link } = this.props;
    console.log(this.props);
    return (
      <Link to={link} className="custom-table_item custom-table-link">
        <span>{title}</span>
        <span>{users}</span>
        <span>{movie}</span>
      </Link>
    );
  }
}

export default RoomItem;

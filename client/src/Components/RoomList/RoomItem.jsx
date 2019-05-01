import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class RoomItem extends Component {
  state = {};

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

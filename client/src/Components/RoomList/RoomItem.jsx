import React from 'react';
import { Link } from 'react-router-dom';

export default function RoomItem({ title, movie, users, link }) {
    return (
        <Link to={link} className="custom-table_item custom-table-link">
            <span>{title}</span>
            <span>{users}</span>
            <span>{movie}</span>
        </Link>
    );
}

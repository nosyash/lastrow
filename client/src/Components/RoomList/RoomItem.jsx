import React from 'react';
import { Link } from 'react-router-dom';

export default function RoomItem({ title, movie, users, link }) {
    return (
        <Link title={movie} to={link} className="custom-table_item custom-table-link">
            {[title, users, movie].map(item => 
                <span key={item} title={item}>{item}</span>
            )}
        </Link>
    );
}

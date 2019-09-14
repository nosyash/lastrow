import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class BreadCrumbs extends Component {
    render() {
        return (
        // <div className="breadcrumbs">
            <div className="breadcrumbs">
                <span className="breadcrumb-item">
                    <Link to="/">Home</Link>
                </span>
                <i className="fa fa-angle-right" />
                <span className="breadcrumb-item">
                    <Link to="/">Rooms</Link>
                </span>
                <i className="fa fa-angle-right" />
                <span className="breadcrumb-item">
                    <span to="/">Coolest room</span>
                </span>
            </div>
        );
    }
}

export default BreadCrumbs;

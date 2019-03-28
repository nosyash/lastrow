import React, { Component } from 'react';
import BreadCrumbs from './BreadCrumbs';

class NavBar extends Component {
  state = {};

  render() {
    return (
      <React.Fragment>
        <div className="nav-bar_custom">
          <div className="nav-bar_overlay" />
          <span />
          <BreadCrumbs />
        </div>
      </React.Fragment>
    );
  }
}

export default NavBar;

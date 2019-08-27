import React, { Component } from 'react';
import BreadCrumbs from './BreadCrumbs';

function NavBar() {
  return (
    <div className="nav-bar_custom">
      <div className="nav-bar_overlay" />
      <span />
      <BreadCrumbs />
    </div>
  );
}

export default NavBar;

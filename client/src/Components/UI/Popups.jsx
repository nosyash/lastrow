import React from 'react';
import { connect } from 'react-redux';
import { getCenteredRect } from '../../utils/base';
import * as types from '../../constants/ActionTypes';

const Popups = ({ popups, removePopup }) => (
  <div className="popups_container">
    {popups.map((element, i) => {
      const Element = element.el;
      return (
        <div
          key={i}
          onMouseDown={e => handleClose(e, element.id, removePopup)}
          className="close-area"
        >
          <div className="popup" style={{ ...getCenteredRect(element.width, element.height) }}>
            {Element}
          </div>
        </div>
      );
    })}
  </div>
);

const handleClose = (e, id, removePopup) =>
  e.target.matches('.close-area') ? removePopup(id) : null;

const mapStateToProps = state => ({
  popups: state.Popups.list,
});

const mapDispatchToProps = {
  removePopup: payload => ({ type: types.REMOVE_POPUP, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Popups);

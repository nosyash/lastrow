import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getCenteredRect } from '../../utils/base';
import * as types from '../../constants/ActionTypes';

class Popups extends Component {
  GetPopup = ({ element }) => (
    <div
      className="popup"
      style={{ ...getCenteredRect(element.width, element.height) }}
    >
      {element.el}
    </div>
  );

  handleClose = (e, id, removePopup) =>
    e.target.matches('.close-area') ? removePopup(id) : null;

  render() {
    const { popups, removePopup } = this.props;
    const { GetPopup } = this;
    return (
      <div className="popups_container">
        {popups.map((popup, index) => {
          const { noBG } = popup;
          if (noBG) {
            return <GetPopup key={index} element={popup} />;
          }
          return (
            <div
              key={index}
              onMouseDown={e => this.handleClose(e, popup.id, removePopup)}
              className="close-area"
            >
              <GetPopup element={popup} />
            </div>
          );
        })}
      </div>
    );
  }
}

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

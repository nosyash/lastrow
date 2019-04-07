import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getCenteredRect } from '../../utils/base';
import * as types from '../../constants/ActionTypes';

class Popups extends Component {
  GetPopup = ({ element }) => (
    <div className="popup" style={{ ...getCenteredRect(element.width, element.height) }}>
      {element.el}
    </div>
  );

  render() {
    const { popups, removePopup } = this.props;
    const { GetPopup } = this;
    return (
      <div className="popups_container">
        {popups.map((element, i) => {
          const { noBG } = element;
          if (noBG) return <GetPopup key={i} element={element} />;
          return (
            <div
              key={i}
              onMouseDown={e => handleClose(e, element.id, removePopup)}
              className="close-area"
            >
              <GetPopup element={element} />
            </div>
          );
        })}
      </div>
    );
  }
}

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

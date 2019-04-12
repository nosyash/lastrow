import React, { Component } from 'react';
import { connect } from 'react-redux';
import { debounce } from 'lodash';
import { getCenteredRect } from '../../utils/base';
import * as types from '../../constants/ActionTypes';

class Popups extends Component {
  constructor() {
    super();
    this.handleResizeTh = debounce(this.handleResize, 50);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKey);
    window.addEventListener('resize', this.handleResizeTh);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKey);
    window.removeEventListener('resize', this.handleResizeTh);
  }

  handleResize = () => {
    const { popups } = this.props;
    if (popups.length) {
      this.forceUpdate();
    }
  };

  handleKey = e => {
    const { popups, removePopup } = this.props;
    const { keyCode } = e;
    const lastPopup = popups[popups.length - 1];
    if (keyCode === 27) {
      if (lastPopup) {
        removePopup(lastPopup.id);
      }
    }
  };

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
        {popups.map(popup => {
          const { noBG } = popup;
          if (noBG) {
            return <GetPopup key={popup.id} element={popup} />;
          }
          return (
            <div
              key={popup.id}
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

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { throttle } from 'lodash';
import { getCenteredRect } from '../../../utils/base';
import * as types from '../../../constants/ActionTypes';
import { POPUP_HEADER } from '../../../constants';

class Popups extends Component {
  constructor() {
    super();
    this.handleResizeTh = throttle(this.handleResize, 16);
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
    if (keyCode !== 27) return;
    if (lastPopup) {
      if (lastPopup.id === 'profile-settings') return;
      removePopup(lastPopup.id);
    }
  };

  handleClose = (e, id, removePopup) =>
    e.target.matches('.close-area') ? removePopup(id) : null;

  render() {
    const { popups } = this.props;

    return (
      <div className="popups_container">
        {popups.map(popup => this.renderSinglePopup(popup))}
      </div>
    );
  }

  renderSinglePopup = popup => (
    <Popup
      key={popup.id}
      removePopup={this.props.removePopup}
      popupElement={popup}
    />
  );
}

class Popup extends Component {
  constructor() {
    super();
    this.state = {
      height: 0,
      width: 0,
      top: 0,
      left: 0,
      moving: false,
    };
    this.clientX = null;
    this.clientY = null;
    this.element = null;
  }

  componentDidMount() {
    const { popupElement } = this.props;
    const { height, width } = popupElement;
    this.setState({ ...getCenteredRect(width, height) });

    this.element.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  componentWillUnmount() {
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseDown = e => {
    const { moving } = this.state;
    if (moving) return;
    const { left, top } = this.element.getBoundingClientRect();
    const { target, clientX, clientY } = e;
    this.clientX = clientX - left;
    this.clientY = clientY - top;
    if (target.matches(POPUP_HEADER)) {
      this.setState({ moving: true });
    }
  };

  handleMouseMove = e => {
    const { moving } = this.state;
    if (!moving) return;

    const { clientX, clientY } = e;

    const { left, top } = this.element.getBoundingClientRect();
    const offsetX = left + (clientX - (left + this.clientX));
    const offsetY = top + (clientY - (top + this.clientY));
    this.setState({ left: offsetX, top: offsetY });
  };

  handleMouseUp = () => {
    const { moving } = this.state;
    if (moving) {
      this.setState({ moving: false });
    }
  };

  render() {
    const { removePopup, popupElement } = this.props;
    const { id, el: element } = popupElement;
    const { width, height, top, left } = this.state;
    return (
      <div
        ref={ref => (this.element = ref)}
        style={{ width, top, left }}
        className="popup"
      >
        <React.Fragment>
          <div data-id={id} className="popup-header">
            <div className="header-controls controls-container">
              <span onClick={() => removePopup(id)} className="control">
                <i className="fas fa-times" />
              </span>
            </div>
          </div>
          {element}
        </React.Fragment>
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

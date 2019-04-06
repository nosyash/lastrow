import React from 'react';
import { connect } from 'react-redux';
import { getCenteredRect } from '../../utils/base';
import * as types from '../../constants/ActionTypes';

const FloatElements = ({ components, removeFloat }) => (
  <div className="float-elements">
    {components.map((el, i) => (
      <div
        key={i}
        onMouseDown={e => handleClose(e, el.id, removeFloat)}
        className="close-area"
      >
        <div
          className="float-element_contaiter"
          style={{ ...getCenteredRect(el.width, el.height) }}
        >
          {el.el}
        </div>
      </div>
    ))}
  </div>
);

const handleClose = (e, id, removeFloat) =>
  e.target.matches('.close-area') ? removeFloat(id) : null;

const mapStateToProps = state => ({
  components: state.Components.list,
});

const mapDispatchToProps = {
  removeFloat: payload => ({ type: types.REMOVE_COMPONENT, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FloatElements);

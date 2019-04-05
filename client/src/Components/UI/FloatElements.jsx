import React from 'react';
import { connect } from 'react-redux';
import { getCenteredRect } from '../../utils/base';

const FloatElements = ({ components }) => (
  <div className="float-elements">
    {components.map((el, i) => (
      <div
        className="float-element_contaiter"
        key={i}
        style={{ ...getCenteredRect(el.width, el.height) }}
      >
        {el.el}
      </div>
    ))}
  </div>
);

const mapStateToProps = state => ({
  components: state.Components.list,
});

export default connect(mapStateToProps)(FloatElements);

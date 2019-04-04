import React from 'react';
import { connect } from 'react-redux';

const FixedComponents = ({ components }) => (
  <div className="float-elements">
    {components.map((el, i) => (
      <div className="float-element_contaiter" key={i}>
        {el.el}
      </div>
    ))}
  </div>
);

const mapStateToProps = state => ({
  components: state.Components.list,
});

export default connect(mapStateToProps)(FixedComponents);

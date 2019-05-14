import React from 'react';
import { ChromePicker } from 'react-color';

class ColorPicker extends React.Component {
  state = {
    color: '#fff',
  };

  componentDidMount() {
    const { color } = this.props;
    this.setState({ color });
  }

  handleChange = ({ hex }) => {
    this.setState({ color: hex });
  };

  handleClose = () => {
    const { onClose } = this.props;
    onClose();
  };

  handleSave = () => {
    const { onSave } = this.props;
    const { color } = this.state;
    onSave(color);
  };

  render() {
    const { color } = this.state;
    const { name } = this.props;
    return (
      <div className="popup-element color-picker_container">
        <div style={{ color }} className="chat-name">
          {name}
        </div>
        <ChromePicker onChange={this.handleChange} color={color} disableAlpha />
        <div className="controls-container">
          <button
            onClick={this.handleSave}
            type="button"
            className="button button-save"
          >
            Save
          </button>
        </div>
      </div>
    );
  }
}

export default ColorPicker;

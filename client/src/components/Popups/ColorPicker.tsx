import React from 'react';
import ChromePicker from 'react-color/lib/components/chrome/Chrome.js';
import { connect } from 'react-redux';
import * as types from '../../constants/actionTypes';
import { requestColorUpdate } from '../../actions';

interface ColorPickerProps {
    color: string;
    name: string;
    onClose: () => void;
    updateColor: (color: string) => void;
    closePopup: () => void;
}

interface ColorPickerState {
    color: string;
}

class ColorPicker extends React.Component<ColorPickerProps, ColorPickerState> {
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

    handleSave = async () => {
        const { updateColor, closePopup } = this.props;
        const { color } = this.state;
        await updateColor(color);
        closePopup();
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
                    <button onClick={this.handleSave} type="button" className="button button-save">
                        Save
                  </button>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => ({
    color: state.profile.color,
});

export default connect(
    mapStateToProps,
    {
        updateColor: payload => requestColorUpdate(payload),
        closePopup: () => ({ type: types.REMOVE_POPUP, payload: 'colorPicker' }),
    }
)(ColorPicker as any);

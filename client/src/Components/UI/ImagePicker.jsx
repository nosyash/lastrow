import React, { Component } from 'react';
import Cropper from 'react-easy-crop';
import { toast } from 'react-toastify';
import { connect } from 'react-redux';
import Slider from '@material-ui/lab/Slider';
import { toastOpts } from '../../constants';
import getCroppedImg from '../../utils/cropImage';
import * as types from '../../constants/ActionTypes';

class ImagePicker extends Component {
  constructor() {
    super();
    this.state = {
      highlight: false,
      base64: '',
    };
    this.startEvents = ['dragenter', 'dragover'];
    this.endEvents = ['dragleave', 'drop'];
  }

  componentDidMount() {
    const { startEvents, endEvents } = this;
    startEvents.map(ev =>
      document.addEventListener(ev, this.handleDropStart, false)
    );
    endEvents.map(ev =>
      document.addEventListener(ev, this.handleDropEnd, false)
    );
  }

  componentWillUnmount() {
    const { startEvents, endEvents } = this;
    startEvents.map(ev =>
      document.removeEventListener(ev, this.handleDropStart, false)
    );
    endEvents.map(ev =>
      document.removeEventListener(ev, this.handleDropEnd, false)
    );
  }

  handleDropStart = e => {
    e.preventDefault();
    const { highlight } = this.state;
    if (!highlight) {
      this.setState({ highlight: true });
    }
  };

  handleDropEnd = e => {
    e.preventDefault();
    this.setState({ highlight: false });

    const { files } = e.dataTransfer;
    if (files.length) {
      this.handleFiles(files);
    }
  };

  handleFiles = files => {
    const file = files[0];
    let { type } = file;

    // Accept only "image" prefix
    const prefix = /image\//;
    if (!prefix.test(type)) {
      return;
    }

    type = type.replace(prefix, '');
    if (type === 'jpeg') {
      type = 'jpg';
    }

    // Server accepts only type prefixed with dot...
    type = `.${type}`;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result;
      this.setState({ base64 });
    };
    reader.onerror = () => {
      toast.error('An error occurred while reading the file.', toastOpts);
    };
  };

  handleImage = data => {
    const { onImageUpdate } = this.props;

    // Server accepts only values without base64 prefix...
    const prefix = /^.*base64,/;
    const base64 = data.replace(prefix, '');
    onImageUpdate(base64);
    this.handleClose();
  };

  handleClose = () => {
    const { id, removePopup } = this.props;
    removePopup(id);
  };

  render() {
    const { highlight, base64 } = this.state;
    const classes = `drop-area${highlight ? ' drop-area_highlight' : ''}`;
    return (
      <RenderPicker
        base64={base64}
        className={classes}
        onClose={this.handleClose}
        onImageGet={this.handleImage}
        inputEl={this.inputEl}
        onRef={ref => (this.inputEl = ref)}
        onClick={() => this.inputEl.click()}
        onInput={e => this.handleFiles(e.target.files)}
        onSelectAnother={() => this.setState({ base64: '' })}
      />
    );
  }
}

const RenderPicker = props => {
  const { onClick, onClose, onInput } = props;
  const { onRef, onSelectAnother, onImageGet } = props;
  const { className, base64 } = props;
  return (
    <div className="float-element image-picker_container">
      <h1 className="title">Select image</h1>

      {!base64 && (
        <React.Fragment>
          <div onClick={onClick} className={className}>
            Click to select file or drop it to the field
          </div>
          <button
            onClick={onClose}
            type="button"
            className="button button-cancel"
          >
            Cancel
          </button>
        </React.Fragment>
      )}
      {base64 && (
        <React.Fragment>
          <div className="crop-tool_container">
            <CropTool
              onSelectAnother={onSelectAnother}
              onImageGet={onImageGet}
              base64={base64}
            />
          </div>
        </React.Fragment>
      )}
      <input
        style={{ display: 'none' }}
        onChange={onInput}
        id="file-input"
        ref={onRef}
        type="file"
      />
    </div>
  );
};

class CropTool extends Component {
  state = {
    crop: { x: 0, y: 0 },
    zoom: 1,
    croppedAreaPixels: {},
  };

  onCropChange = crop => {
    this.setState({ crop });
  };

  onCropComplete = async (croppedArea, croppedAreaPixels) => {
    this.setState({ croppedAreaPixels });
  };

  saveCrop = async () => {
    const { croppedAreaPixels } = this.state;
    const { base64 } = this.props;
    const { onImageGet } = this.props;

    const options = { width: 500, height: 500 };
    const croppedImage = await getCroppedImg(
      base64,
      croppedAreaPixels,
      options
    );
    onImageGet(croppedImage);
  };

  onZoomChange = zoom => {
    this.setState({ zoom });
  };

  render() {
    const { base64 } = this.props;
    const { onSelectAnother } = this.props;
    const { crop, zoom } = this.state;
    return (
      <React.Fragment>
        <div className="crop-tool">
          <Cropper
            image={base64}
            crop={crop}
            zoom={zoom}
            zoomSpeed={2}
            maxZoom={10}
            aspect={1}
            showGrid={false}
            classes={{ cropAreaClassName: 'cropper' }}
            onCropChange={this.onCropChange}
            onCropComplete={this.onCropComplete}
            onZoomChange={this.onZoomChange}
          />
        </div>
        <div className="crop-controls">
          <Slider
            classes={{
              root: 'slider-root',
              track: 'slider-track',
              thumb: 'slider-thumb',
            }}
            value={zoom}
            min={1}
            max={10}
            step={0.01}
            aria-labelledby="Zoom"
            onChange={(e, z) => this.onZoomChange(z)}
          />
          <div className="controls-container">
            <button
              onClick={this.saveCrop}
              type="button"
              className="button button-save"
            >
              Save
            </button>
            {base64 && (
              <button
                onClick={() => {
                  this.setState = { zoom: 1 };
                  onSelectAnother();
                }}
                type="button"
                className="button button-cancel"
              >
                Choose another
              </button>
            )}
          </div>
        </div>
      </React.Fragment>
    );
  }
}

const mapDispatchToProps = {
  removePopup: payload => ({ type: types.REMOVE_POPUP, payload }),
};

export default connect(
  null,
  mapDispatchToProps
)(ImagePicker);

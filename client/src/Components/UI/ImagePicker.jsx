import React, { Component } from 'react';
import Cropper from 'react-easy-crop';
import { toast } from 'react-toastify';
import { connect } from 'react-redux';
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
    const { dropArea, startEvents, endEvents } = this;
    startEvents.map(ev => dropArea.addEventListener(ev, this.handleDropStart, false));
    endEvents.map(ev => dropArea.addEventListener(ev, this.handleDropEnd, false));
  }

  componentWillUnmount() {
    const { dropArea, startEvents, endEvents } = this;
    if (!dropArea) return;
    startEvents.map(ev => dropArea.removeEventListener(ev, this.handleDropStart, false));
    endEvents.map(ev => dropArea.removeEventListener(ev, this.handleDropEnd, false));
  }

  handleDropStart = e => {
    e.preventDefault();
    const { highlight } = this.state;
    if (!highlight) this.setState({ highlight: true });
  };

  handleDropEnd = e => {
    e.preventDefault();
    this.setState({ highlight: false });

    const { files } = e.dataTransfer;
    if (files.length) this.handleDropFiles(files);
  };

  handleDropFiles = files => {
    const file = files[0];
    console.log(files);
    let { type } = file;

    if (!/image\//.test(type)) return;
    type = type.replace(/image\//, '');
    if (type === 'jpeg') type = 'jpg';
    type = `.${type}`;

    const reader = new FileReader();
    reader.readAsDataURL(files[0]);
    reader.onload = () => {
      const { result } = reader;
      // const base64 = result.replace(/^.*base64,/, '');
      const base64 = result;
      this.setState({ base64 });
    };
    reader.onerror = () => {
      toast.error('An error occurred while reading the file.', toastOpts);
    };
  };

  handleImage = data => {
    const { onImageUpdate } = this.props;
    const base64 = data.replace(/^.*base64,/, '');
    onImageUpdate(base64);
    this.handleClose();
  };

  handleClose = () => {
    const { id, removePopup } = this.props;
    removePopup(id);
  };

  render() {
    const { highlight, base64 } = this.state;
    const className = `drop-area${highlight ? ' drop-area_highlight' : ''}`;
    return (
      <div className="float-element image-picker_container">
        <h1 className="title">Select image</h1>

        {!base64 && <div ref={ref => (this.dropArea = ref)} className={className} />}
        {base64 && (
          <React.Fragment>
            <div className="crop-tool_container">
              <CropTool onImageGet={this.handleImage} base64={base64} />
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }
}

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
    console.log(croppedArea, croppedAreaPixels);
    this.setState({ croppedAreaPixels });
  };

  saveCrop = async () => {
    const { croppedAreaPixels } = this.state;
    const { base64 } = this.props;
    const { onImageGet } = this.props;

    const options = { width: 500, height: 500 };
    const croppedImage = await getCroppedImg(base64, croppedAreaPixels, options);
    onImageGet(croppedImage);
  };

  onZoomChange = zoom => {
    this.setState({ zoom });
  };

  render() {
    const { base64 } = this.props;
    const { crop, zoom } = this.state;
    return (
      <React.Fragment>
        <div className="crop-tool">
          <Cropper
            image={base64}
            crop={crop}
            zoom={zoom}
            zoomSpeed={0.35}
            maxZoom={7}
            aspect={1}
            showGrid={false}
            classes={{ cropAreaClassName: 'cropper' }}
            onCropChange={this.onCropChange}
            onCropComplete={this.onCropComplete}
            onZoomChange={this.onZoomChange}
          />
        </div>
        <div className="crop-controls">
          <button onClick={this.saveCrop} type="button" className="button button-cancel">
            Save
          </button>
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

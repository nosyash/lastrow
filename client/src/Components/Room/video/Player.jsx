import React, { Component } from 'react';
import { connect } from 'react-redux';
import ReactPlayer from 'react-player';
import { UPDATE_PLAYER } from '../../../constants/ActionTypes';

class Player extends Component {
  constructor(props) {
    super(props);
    this.videoItem = null;
  }

  componentDidMount() {
    const { videoItem } = this.props;
    this.videoItem = videoItem.current;
    // console.log(this.videoItem);
  }

  render() {
    const { media } = this.props;
    // console.log(player);
    return (
      <ReactPlayer
        className="player-inner"
        width="100%"
        height="100%"
        autoPlay={false}
        controls
        config={{
          youtube: {
            playerVars: { autoplay: 0, controls: 1 },
            preload: true,
          },
        }}
        url={media.url}
        playing={false}
      />
      // <div className="video-player">
      //   <div className="progress-bar">
      //     <div className="progress-bar_passed" />
      //   </div>
      //   <div className="video-player_overflow" />
      // </div>
    );
  }
}

const mapStateToProps = state => ({ media: state.Media });
const mapDispatchToProps = {
  UpdatePlayer: payload => ({ type: UPDATE_PLAYER, payload }),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Player);

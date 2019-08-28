import React from 'react';
import Player from './Player';

export default function VideoContainer({ videoRef }) {
  return (
    <div ref={videoRef} className="video-container">
      <Player />
    </div>
  );
}

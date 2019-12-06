import React, { useState, useEffect, useRef } from 'react';
import Player from './Player';

export default function VideoContainer() {
    const [fullscreen, setFullscreen] = useState(false);
    const fs = useRef(false);
    useEffect(() => {
        window.addEventListener('fullscreenchange', changeFullscreen)

        return () => {
            window.removeEventListener('fullscreenchange', changeFullscreen)
        }
    }, [])

    function changeFullscreen() {
        setFullscreen(!fs.current)
        fs.current = !fs.current
    }

    return (
        <div
            id="video-container"
            style={{ background: fullscreen ? 'black' : '' }}
            className="video-container">
            <Player />
        </div>
    );
}

function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

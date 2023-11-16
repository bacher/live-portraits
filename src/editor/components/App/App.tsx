import { Editor } from '../Editor';

import './App.module.css';
import { useState } from 'react';

export function App() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>();
  const [canvasElement, setCanvasElement] =
    useState<HTMLCanvasElement | null>();

  return (
    <div>
      <video
        autoPlay
        playsInline
        // eslint-disable-next-line react/no-unknown-property
        webkit-playsinline="true"
        muted
        // hidden
        ref={setVideoElement}
      />
      <canvas width="1920" height="1080" ref={setCanvasElement}></canvas>
      {videoElement && canvasElement && (
        <Editor videoElement={videoElement} canvasElement={canvasElement} />
      )}
    </div>
  );
}

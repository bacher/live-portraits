import { useState } from 'react';

import { Editor } from '../Editor';
import styles from './App.module.css';

export function App() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>();
  const [canvasElement, setCanvasElement] =
    useState<HTMLCanvasElement | null>();

  return (
    <div className={styles.wrapper}>
      <video
        className={styles.video}
        autoPlay
        playsInline
        // eslint-disable-next-line react/no-unknown-property
        webkit-playsinline="true"
        muted
        // hidden
        ref={setVideoElement}
      />
      <div className={styles.canvasWrapper}>
        <canvas
          className={styles.canvas}
          width="1024"
          height="1024"
          ref={setCanvasElement}
        ></canvas>
        {videoElement && canvasElement && (
          <Editor videoElement={videoElement} canvasElement={canvasElement} />
        )}
      </div>
    </div>
  );
}

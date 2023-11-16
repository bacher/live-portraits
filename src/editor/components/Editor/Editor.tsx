import { useEffect } from 'react';
import { useOnlyOnce } from '../../hooks/useOnlyOnce.ts';

type Props = {
  videoElement: HTMLVideoElement;
  canvasElement: HTMLCanvasElement;
};

export function Editor({ videoElement, canvasElement }: Props) {
  useOnlyOnce(() => {
    const localStreamConstraints = {
      audio: true,
      video: {
        width: 1920,
        height: 1080,
      },
    };

    navigator.mediaDevices
      .getUserMedia(localStreamConstraints)
      .then((stream) => {
        videoElement.srcObject = stream;
      })
      .catch((error: any) => {
        if (
          confirm(
            `An error with camera occurred:(${error.name}) Do you want to reload?`,
          )
        ) {
          location.reload();
        }
      });
  }, []);

  return <div>123</div>;
}

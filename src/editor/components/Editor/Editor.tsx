import { CSSProperties, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { useOnlyOnce } from '../../hooks/useOnlyOnce.ts';

import { Arrow } from './Arrow';
import styles from './Editor.module.css';
import { useRefState } from '../../hooks/useRefState.ts';

const TURN_TIME_MS = 5000;

const CAPTURES_COUNT = 12;

type Props = {
  videoElement: HTMLVideoElement;
  canvasElement: HTMLCanvasElement;
};

enum ModeType {
  IDLE = 'IDLE',
  PREPARE = 'PREPARE',
  CAPTURING = 'CAPTURING',
  RESULTS = 'RESULTS',
}

type Mode =
  | {
      type: ModeType.IDLE | ModeType.CAPTURING | ModeType.RESULTS;
    }
  | {
      type: ModeType.PREPARE;
      countdown: number;
    };

type Frame = {
  index: number;
  blob: Blob;
  url: string;
};

export function Editor({ videoElement, canvasElement }: Props) {
  const nav = useNavigate();
  const [mode, setMode] = useRefState<Mode>({
    type: ModeType.IDLE,
  });
  const [direction, setDirection] = useState(0);
  const [accountName, setAccountName] = useState('');

  const [frames] = useState<Frame[]>([]);

  const ctx = useMemo<CanvasRenderingContext2D>(() => {
    const ctx = canvasElement.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('No canvas');
    }
    return ctx;
  }, [canvasElement]);

  function draw() {
    ctx.save();
    ctx.translate(canvasElement.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(
      videoElement,
      0,
      0,
      canvasElement.width,
      canvasElement.height,
    );
    ctx.restore();
  }

  const animationStartedAt = useRef(0);

  function tick(delta: number): void {
    if (mode.current.type === ModeType.CAPTURING) {
      const increment = delta / TURN_TIME_MS;

      setDirection((direction) => direction + increment);
    }
  }

  function startFrameLoop(time: number): void {
    const prev = animationStartedAt.current;
    animationStartedAt.current = time;
    const diff = time - prev;
    if (diff > 0) {
      tick(diff);
    }
    draw();
    requestAnimationFrame(startFrameLoop);
  }

  function startAnimation() {
    animationStartedAt.current = performance.now();
    startFrameLoop(animationStartedAt.current);
  }

  useOnlyOnce(() => {
    const localStreamConstraints = {
      audio: false,
      video: {
        width: 1024,
        height: 1024,
      },
    };

    navigator.mediaDevices
      .getUserMedia(localStreamConstraints)
      .then((stream) => {
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        startAnimation();
      })
      .catch((error) => {
        console.error(error);

        if (
          confirm(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            `An error with camera occurred: (${error.name}) Do you want to reload?`,
          )
        ) {
          location.reload();
        }
      });
  });

  function captureFrame(frameIndex: number): void {
    canvasElement.toBlob((blob) => {
      if (!blob) {
        throw new Error('No image blob');
      }

      frames.push({
        index: frameIndex,
        blob,
        url: URL.createObjectURL(blob),
      });
    });
  }

  switch (mode.current.type) {
    case ModeType.IDLE: {
      return (
        <button
          type="button"
          className={styles.startButton}
          onClick={() => {
            setMode({
              type: ModeType.PREPARE,
              countdown: 3,
            });

            setTimeout(() => {
              setMode({
                type: ModeType.PREPARE,
                countdown: 2,
              });

              setTimeout(() => {
                setMode({
                  type: ModeType.PREPARE,
                  countdown: 1,
                });

                setTimeout(() => {
                  setMode({
                    type: ModeType.CAPTURING,
                  });

                  let captureNumber = 0;

                  captureFrame(captureNumber);
                  captureNumber += 1;

                  const intervalId = window.setInterval(() => {
                    captureFrame(captureNumber);
                    captureNumber += 1;

                    if (captureNumber === 12) {
                      window.clearInterval(intervalId);
                    }
                  }, TURN_TIME_MS / CAPTURES_COUNT);

                  setTimeout(() => {
                    setMode({
                      type: ModeType.RESULTS,
                    });
                  }, TURN_TIME_MS);
                }, 1000);
              }, 1000);
            }, 1000);
          }}
        >
          Start
        </button>
      );
    }
    case ModeType.PREPARE:
    case ModeType.CAPTURING:
      return (
        <>
          <Arrow direction={direction} />
          {mode.current.type === ModeType.PREPARE && (
            <div className={styles.countdown}>{mode.current.countdown}</div>
          )}
        </>
      );
    case ModeType.RESULTS:
      return (
        <div className={styles.results}>
          {/*<div className={styles.resultsGrid}>*/}
          {/*  {frames.map(({ index, url }) => (*/}
          {/*    <img className={styles.frameImage} key={index} src={url} />*/}
          {/*  ))}*/}
          {/*</div>*/}
          <div className={styles.resultsCircle}>
            {frames.map(({ index, url }) => (
              <img
                className={styles.circleImage}
                key={index}
                src={url}
                style={
                  {
                    '--angle': index / 12,
                  } as CSSProperties
                }
              />
            ))}
            <div className={styles.finalQuestion}>
              <div className={styles.mainQuestion}>Is it okay?</div>
              <div className={styles.finalSubQuestion}>
                or you can <br />
                try it again:
              </div>
              <div className={styles.buttonWrapper}>
                <button
                  type="button"
                  className={styles.tryAgainButton}
                  onClick={() => {
                    frames.length = 0;
                    setDirection(0);
                    setMode({
                      type: ModeType.IDLE,
                    });
                  }}
                >
                  Repeat
                </button>
              </div>
            </div>
          </div>
          <form
            className={styles.actions}
            onSubmit={async (event) => {
              event.preventDefault();

              let account = accountName.trim();

              if (!account) {
                account = Math.random().toString().substring(2);
                setAccountName(account);
              }

              try {
                await Promise.all(
                  frames.map(async ({ blob, index }) => {
                    const formData = new FormData();
                    formData.append('accountName', account);
                    formData.append('index', index.toString());
                    formData.append('file', blob);

                    const response = await fetch(
                      'http://localhost:3000/upload',
                      {
                        method: 'POST',
                        body: formData,
                        mode: 'no-cors',
                      },
                    );

                    // In no-cors mode we can't check ".ok"
                    // if (!response.ok) {
                    //   throw new Error();
                    // }
                  }),
                );

                nav('/show');
              } catch (error) {
                console.error(error);
                window.alert('[PROBLEM] Something went wrong!');
              }
            }}
          >
            <input
              className={styles.accountName}
              placeholder="Account name"
              autoFocus
              value={accountName}
              onChange={(event) => {
                setAccountName(event.target.value);
              }}
            />

            <button type="submit" className={styles.sendButton}>
              Send
            </button>
          </form>
        </div>
      );
  }
}

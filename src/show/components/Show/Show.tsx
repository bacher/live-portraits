import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useOnlyOnce } from '../../../editor/hooks/useOnlyOnce.ts';
import { useRefState } from '../../../editor/hooks/useRefState.ts';
import { useForceUpdate } from '../../../editor/hooks/useForceUpdate.ts';
import styles from './Show.module.css';

enum IdleMode {
  RANDOM = 'RANDOM',
  NODDING = 'NODDING',
  ROCK = 'ROCK',
  ROCK_2 = 'ROCK_2',
  ARC = 'ARC',
}

type Coords = {
  x: number;
  y: number;
};

export function Show() {
  const forceUpdate = useForceUpdate();
  const [accounts, setAccounts] = useRefState<string[] | undefined>(undefined);
  const gridRef = useRef<HTMLDivElement>(null);
  const avatarsPositionsRef = useRef<Map<string, Coords | undefined>>(
    new Map(),
  );
  const avatarsFrameIndexesRef = useRef<Map<string, number | undefined>>(
    new Map(),
  );
  const mouseRef = useRef<Coords & { lastChangeAt: number }>();
  const [idleMode, setIdleMode] = useRefState(IdleMode.RANDOM);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const mouse = mouseRef.current;

      if (!accounts.current || !mouse) {
        return;
      }

      if (performance.now() - mouse.lastChangeAt < 3000) {
        return;
      }

      const indexes = avatarsFrameIndexesRef.current;
      let somethingUpdated = false;

      switch (idleMode.current) {
        case IdleMode.RANDOM: {
          for (const [accountName, value] of indexes.entries()) {
            if (Math.random() < 0.025) {
              indexes.set(
                accountName,
                cap((value ?? 0) + (Math.random() < 0.5 ? 1 : -1), 12),
              );
              somethingUpdated = true;
            }
          }
          break;
        }
        case IdleMode.NODDING: {
          const cycle = Math.floor((2 * performance.now() * 0.001) % 2);

          let i = 0;
          for (const [accountName, value] of indexes.entries()) {
            if (i % 2 === 0) {
              indexes.set(accountName, 10 - cycle);
            } else {
              indexes.set(accountName, 3 + cycle);
            }
            i += 1;
          }
          somethingUpdated = true;
          break;
        }
        case IdleMode.ROCK: {
          const cycle = Math.floor((2 * performance.now() * 0.001) % 2);

          let i = 0;
          for (const [accountName, value] of indexes.entries()) {
            if (i % 2 === 0) {
              indexes.set(accountName, 2 + cycle);
            } else {
              indexes.set(accountName, 8 - cycle);
            }
            i += 1;
          }
          somethingUpdated = true;
          break;
        }
        case IdleMode.ROCK_2: {
          const cycle = Math.floor((12 * performance.now() * 0.0015) % 12);

          for (const [accountName, value] of indexes.entries()) {
            indexes.set(accountName, cycle);
          }
          somethingUpdated = true;
          break;
        }
        case IdleMode.ARC: {
          const sin = (1 + Math.sin(performance.now() * 0.0015)) * 0.5;
          const cycle = Math.floor((12 * sin) % 12);

          for (const [accountName, value] of indexes.entries()) {
            indexes.set(accountName, cycle);
          }
          somethingUpdated = true;
          break;
        }
      }

      if (somethingUpdated) {
        forceUpdate();
      }
    }, 25);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    document.body.classList.add(styles.cursor);

    return () => {
      document.body.classList.remove(styles.cursor);
    };
  }, []);

  useOnlyOnce(() => {
    (async () => {
      const response = await fetch('/accounts.json');
      const data = (await response.json()) as any;
      setAccounts(data.accounts);
    })();
  });

  useEffect(() => {
    window.addEventListener('resize', () => {
      calculateAvatarPositions();
      calculateAvatarsFrameIndexes();
    });
  }, []);

  useEffect(() => {
    if (accounts.current) {
      calculateAvatarPositions();
    }
  }, [accounts.current]);

  useOnlyOnce(() => {
    window.addEventListener('mousemove', (event) => {
      mouseRef.current = {
        x: event.pageX,
        y: event.pageY,
        lastChangeAt: performance.now(),
      };
      calculateAvatarsFrameIndexes();
    });
  });

  function calculateAvatarPositions() {
    const gridDiv = gridRef.current!;
    const poses = avatarsPositionsRef.current;

    const avatars =
      gridDiv.querySelectorAll<HTMLImageElement>('img[data-account]');

    const scrollX = document.scrollingElement!.scrollLeft;
    const scrollY = document.scrollingElement!.scrollTop;

    for (const avatar of avatars) {
      const account = avatar.dataset.account!;

      const box = avatar.getBoundingClientRect();

      poses.set(account, {
        x: scrollX + box.x + box.width / 2,
        y: scrollY + box.y + box.height / 2,
      });
    }
  }

  function calculateAvatarsFrameIndexes() {
    const indexes = avatarsFrameIndexesRef.current;
    const positions = avatarsPositionsRef.current;
    const mouse = mouseRef.current!;

    if (!accounts.current || !mouse) {
      return;
    }

    let needUpdate = false;

    for (const account of accounts.current) {
      const center = positions.get(account);

      if (center) {
        const x = center.x - mouse.x + 10;
        const y = center.y - mouse.y + 10;

        const tan = getTan(x, y);

        const index = Math.floor(tan * 12);

        const currentIndex = indexes.get(account);

        if (!currentIndex || index !== currentIndex) {
          indexes.set(account, index);
          needUpdate = true;
        }
      }
    }

    if (needUpdate) {
      forceUpdate();
    }
  }

  if (!accounts.current) {
    return <div>Loading</div>;
  }

  function updateIdleMode(idleMode: IdleMode): void {
    setIdleMode(idleMode);
    if (mouseRef.current) {
      mouseRef.current.lastChangeAt = -100000;
      setTimeout(() => {
        if (mouseRef.current) {
          mouseRef.current.lastChangeAt = -100000;
        }
      }, 10);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>Idle activity mode:</div>
        <label>
          <input
            type="radio"
            name="idlemode"
            value={IdleMode.RANDOM}
            checked={idleMode.current === IdleMode.RANDOM}
            onChange={(event) => {
              updateIdleMode(event.target.value as IdleMode);
            }}
          />
          Random
        </label>
        <label>
          <input
            type="radio"
            name="idlemode"
            value={IdleMode.NODDING}
            checked={idleMode.current === IdleMode.NODDING}
            onChange={(event) => {
              updateIdleMode(event.target.value as IdleMode);
            }}
          />
          Nodding
        </label>
        <label>
          <input
            type="radio"
            name="idlemode"
            value={IdleMode.ROCK}
            checked={idleMode.current === IdleMode.ROCK}
            onChange={(event) => {
              updateIdleMode(event.target.value as IdleMode);
            }}
          />
          Rock
        </label>
        <label>
          <input
            type="radio"
            name="idlemode"
            value={IdleMode.ROCK_2}
            checked={idleMode.current === IdleMode.ROCK_2}
            onChange={(event) => {
              updateIdleMode(event.target.value as IdleMode);
            }}
          />
          Rock 2
        </label>
        <label>
          <input
            type="radio"
            name="idlemode"
            value={IdleMode.ARC}
            checked={idleMode.current === IdleMode.ARC}
            onChange={(event) => {
              updateIdleMode(event.target.value as IdleMode);
            }}
          />
          Arc
        </label>
      </div>
      <div ref={gridRef} className={styles.grid}>
        {accounts.current.map((accountName) => (
          <div key={accountName} className={styles.member}>
            <img
              className={styles.memberAvatar}
              src={`/${accountName}/f${
                avatarsFrameIndexesRef.current.get(accountName) ?? 0
              }.png`}
              alt=""
              data-account={accountName}
            />
            {accountName}
          </div>
        ))}
        <Link to="/editor" className={styles.addNew}>
          Add new avatar
        </Link>
      </div>
    </div>
  );
}

function getTan(x: number, y: number): number {
  const tan = Math.atan2(y, x) / (2 * Math.PI) + 0.25;

  return cap(tan, 1);
}

function cap(value: number, limit: number): number {
  const rest = value % limit;

  if (rest < 0) {
    return rest + limit;
  }

  return rest;
}

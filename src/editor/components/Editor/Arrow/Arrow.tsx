import type { CSSProperties } from 'react';

import styles from './Arrow.module.css';

type Props = {
  direction: number;
};

export function Arrow({ direction }: Props) {
  return (
    <div
      className={styles.arrow}
      style={
        {
          '--rotation-angle': direction,
        } as CSSProperties
      }
    ></div>
  );
}

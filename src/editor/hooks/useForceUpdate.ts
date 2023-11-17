import { useState } from 'react';

export function useForceUpdate() {
  const [, setState] = useState(0);

  return () => {
    setState((current) => current + 1);
  };
}

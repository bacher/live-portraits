import { useEffect, useRef } from 'react';

export function useOnlyOnce(callback: () => void): void {
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      callback();
    }
  }, []);
}

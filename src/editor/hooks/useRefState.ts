import { useRef, useState } from 'react';

export function useRefState<T>(
  initialValue: T,
): [{ current: T }, (value: T) => void] {
  const valueRef = useRef<T>(initialValue);
  const [, setCounter] = useState(0);

  function setValue(value: T) {
    valueRef.current = value;
    setCounter((state) => state + 1);
  }

  return [valueRef, setValue];
}

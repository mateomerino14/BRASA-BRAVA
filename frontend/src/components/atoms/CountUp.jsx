import {useEffect, useRef, useState} from 'react';
import {animate, useReducedMotionConfig} from 'motion/react';

const DURATION_S = 0.9;

// Número que sube desde el valor anterior hasta el nuevo; con movimiento reducido cambia de golpe
export function CountUp({value, format = String}) {
  const reduce = useReducedMotionConfig();
  let initial = 0;
  if (reduce) {
    initial = value;
  }
  const [shown, setShown] = useState(initial);
  const from = useRef(0);

  useEffect(() => {
    if (reduce) {
      from.current = value;
      return undefined;
    }
    const controls = animate(from.current, value, {
      duration: DURATION_S,
      ease: 'easeOut',
      onUpdate: (latest) => setShown(latest),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  let display = shown;
  if (reduce) {
    display = value;
  }
  return format(display);
}

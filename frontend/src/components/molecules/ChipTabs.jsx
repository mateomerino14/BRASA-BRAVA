import {useCallback, useEffect, useId, useRef, useState} from 'react';
import {motion} from 'motion/react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {cn} from '../../lib/cn';

const styles = {
  root: 'relative flex items-center gap-2',
  scroller: '-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  chip: 'relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brasa',
  idle: 'border-arena/70 bg-white text-cafe hover:border-brasa/60 hover:text-carbon',
  selected: 'border-brasa text-white',
  pill: 'absolute inset-0 rounded-full bg-brasa shadow-brasa',
  content: 'relative flex items-center gap-2',
  count: 'rounded-full px-1.5 text-xs tabular-nums',
  countIdle: 'bg-hueso text-cafe',
  countSelected: 'bg-white/25 text-white',
  srOnly: 'sr-only',
  arrow: 'flex size-9 shrink-0 items-center justify-center rounded-full border border-arena bg-white text-cafe shadow-card transition-colors hover:border-brasa hover:bg-brasa hover:text-white',
};

const pillSpring = {type: 'spring', stiffness: 420, damping: 34};
const FADE_PX = 40;
const EDGE_TOLERANCE = 2;

// Difumina el borde por donde todavía hay chips escondidos
const fadeMask = ({start, end}) => {
  const left = start ? `transparent, black ${FADE_PX}px` : 'black, black';
  const right = end ? `black calc(100% - ${FADE_PX}px), transparent` : 'black, black';
  const mask = `linear-gradient(to right, ${left}, ${right})`;
  return {maskImage: mask, WebkitMaskImage: mask};
};

// Opciones excluyentes en chips que se desplazan de lado (secciones, categorías). Si no entran, aparecen flechas
// y el borde se difumina; cada chip puede mostrar un contador con su texto para lectores de pantalla
export function ChipTabs({label, options, value, onChange, className}) {
  const groupId = useId();
  const scrollerRef = useRef(null);
  const [hidden, setHidden] = useState({start: false, end: false});

  const measure = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) {
      return;
    }
    const start = node.scrollLeft > EDGE_TOLERANCE;
    const end = node.scrollLeft + node.clientWidth < node.scrollWidth - EDGE_TOLERANCE;
    setHidden((current) => {
      if (current.start === start && current.end === end) {
        return current;
      }
      return {start, end};
    });
  }, []);

  useEffect(() => {
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(scrollerRef.current);
    return () => observer.disconnect();
  }, [measure, options.length]);

  // Avanza casi una pantalla de chips hacia el lado indicado
  const scrollBy = (direction) => {
    const node = scrollerRef.current;
    node.scrollBy({left: direction * node.clientWidth * 0.8});
  };

  return (
    <div className={cn(styles.root, className)}>
      {hidden.start && (
        <button type="button" tabIndex={-1} aria-hidden onClick={() => scrollBy(-1)} className={styles.arrow}>
          <ChevronLeft size={18} />
        </button>
      )}
      <div ref={scrollerRef} role="radiogroup" aria-label={label} onScroll={measure} style={fadeMask(hidden)} className={styles.scroller}>
        {options.map((option) => {
          const selected = option.value === value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(styles.chip, selected ? styles.selected : styles.idle)}
            >
              {selected && <motion.span layoutId={`chip-${groupId}`} transition={pillSpring} className={styles.pill} />}
              <span className={styles.content}>
                {Icon && <Icon size={15} aria-hidden />}
                {option.label}
                {option.count !== undefined && (
                  <>
                    <span aria-hidden className={cn(styles.count, selected ? styles.countSelected : styles.countIdle)}>{option.count}</span>
                    <span className={styles.srOnly}>, {option.countLabel ?? option.count}</span>
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {hidden.end && (
        <button type="button" tabIndex={-1} aria-hidden onClick={() => scrollBy(1)} className={styles.arrow}>
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

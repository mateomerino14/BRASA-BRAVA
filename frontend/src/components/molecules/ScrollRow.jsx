import {useCallback, useEffect, useRef, useState} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {cn} from '../../lib/cn';

const styles = {
  root: 'relative flex items-center gap-2',
  scroller: '-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  arrow: 'flex size-9 shrink-0 items-center justify-center rounded-full border border-arena bg-white text-cafe shadow-card transition-colors hover:border-brasa hover:bg-brasa hover:text-white',
};

const FADE_PX = 40;
const EDGE_TOLERANCE = 2;
const PAGE_SHARE = 0.8;

const fadeMask = ({start, end}) => {
  const left = start ? `transparent, black ${FADE_PX}px` : 'black, black';
  const right = end ? `black calc(100% - ${FADE_PX}px), transparent` : 'black, black';
  const mask = `linear-gradient(to right, ${left}, ${right})`;
  return {maskImage: mask, WebkitMaskImage: mask};
};

export function ScrollRow({label, role, count, className, scrollerClassName, children}) {
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
  }, [measure, count]);

  const scrollBy = (direction) => {
    const node = scrollerRef.current;
    node.scrollBy({left: direction * node.clientWidth * PAGE_SHARE});
  };

  return (
    <div className={cn(styles.root, className)}>
      {hidden.start && (
        <button type="button" tabIndex={-1} aria-hidden onClick={() => scrollBy(-1)} className={styles.arrow}>
          <ChevronLeft size={18} />
        </button>
      )}
      <div ref={scrollerRef} role={role} aria-label={label} onScroll={measure} style={fadeMask(hidden)} className={cn(styles.scroller, scrollerClassName)}>
        {children}
      </div>
      {hidden.end && (
        <button type="button" tabIndex={-1} aria-hidden onClick={() => scrollBy(1)} className={styles.arrow}>
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

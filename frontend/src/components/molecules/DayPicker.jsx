import {motion} from 'motion/react';
import {cn} from '../../lib/cn';
import {ALL_DAYS} from '../../lib/week';

const styles = {
  wrapper: 'flex flex-wrap items-center gap-1.5',
  day: 'flex size-10 items-center justify-center rounded-full border text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-brasa',
  on: 'border-brasa bg-brasa text-white shadow-brasa',
  off: 'border-arena bg-campo text-cafe hover:border-brasa hover:text-brasa',
  all: 'ml-1 rounded-full px-3 py-1.5 text-xs font-semibold text-brasa transition-colors hover:bg-brasa/10',
};

const DAYS = [
  {index: 1, short: 'L', name: 'Lunes'},
  {index: 2, short: 'M', name: 'Martes'},
  {index: 3, short: 'X', name: 'Miércoles'},
  {index: 4, short: 'J', name: 'Jueves'},
  {index: 5, short: 'V', name: 'Viernes'},
  {index: 6, short: 'S', name: 'Sábado'},
  {index: 0, short: 'D', name: 'Domingo'},
];
const tapPress = {scale: 0.88};

export function DayPicker({value, onChange}) {
  const toggle = (index) => {
    const days = value.split('');
    let next = '1';
    if (days[index] === '1') {
      next = '0';
    }
    days[index] = next;
    onChange(days.join(''));
  };

  return (
    <div role="group" aria-label="Días de la semana" className={styles.wrapper}>
      {DAYS.map((day) => {
        const on = value[day.index] === '1';
        return (
          <motion.button
            key={day.index}
            type="button"
            aria-label={day.name}
            aria-pressed={on}
            whileTap={tapPress}
            onClick={() => toggle(day.index)}
            className={cn(styles.day, on ? styles.on : styles.off)}
          >
            {day.short}
          </motion.button>
        );
      })}
      {value !== ALL_DAYS && (
        <button type="button" onClick={() => onChange(ALL_DAYS)} className={styles.all}>
          Todos los días
        </button>
      )}
    </div>
  );
}

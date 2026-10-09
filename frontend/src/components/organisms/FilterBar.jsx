const styles = {
  bar: 'flex flex-wrap items-center gap-3 rounded-card border border-arena/40 bg-white p-4 shadow-card',
};

export function FilterBar({children}) {
  return (
    <section aria-label="Búsqueda y filtros" className={styles.bar}>
      {children}
    </section>
  );
}

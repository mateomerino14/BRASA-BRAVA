const styles = {
  page: 'flex min-h-dvh flex-col items-center justify-center gap-2 bg-lienzo',
  title: 'font-display text-6xl text-brasa',
  subtitle: 'text-cafe',
};

export function App() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Brasa Brava</h1>
      <p className={styles.subtitle}>Panel de gestión en construcción</p>
    </main>
  );
}

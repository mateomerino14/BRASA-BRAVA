import {Link} from 'react-router';

const styles = {
  page: 'flex min-h-dvh flex-col items-center justify-center gap-4 bg-lienzo text-center',
  code: 'font-display text-8xl text-brasa',
  title: 'font-display text-4xl text-carbon',
  link: 'font-semibold text-rojo underline-offset-4 hover:underline',
};

export function NotFoundPage() {
  return (
    <div className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Página no encontrada</h1>
      <Link to="/" className={styles.link}>
        Volver al inicio
      </Link>
    </div>
  );
}

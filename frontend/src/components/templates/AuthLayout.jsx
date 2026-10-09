import {Footer} from '../organisms/Footer';

const styles = {
  screen: 'flex min-h-dvh flex-col bg-lienzo bg-auth-glow',
  main: 'mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-8',
};

export function AuthLayout({children}) {
  return (
    <div className={styles.screen}>
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}

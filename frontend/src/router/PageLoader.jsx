import {Spinner} from '../components/atoms/Spinner';

const styles = {
  wrapper: 'flex justify-center py-24',
};

// Indicador mientras se descarga una pantalla
export function PageLoader() {
  return (
    <div className={styles.wrapper}>
      <Spinner size={32} label="Cargando pantalla" />
    </div>
  );
}

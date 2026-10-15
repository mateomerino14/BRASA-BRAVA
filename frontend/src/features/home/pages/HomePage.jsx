import {useAuth} from '../../../context/useAuth';
import {NAVIGATION, filterNavigation, flattenNavigation} from '../../../config/navigation';
import {WelcomeCard} from '../components/WelcomeCard';
import {QuickAccessGrid} from '../components/QuickAccessGrid';
import {DaySummary} from '../components/DaySummary';
import {useDaySummary} from '../hooks/useDaySummary';

const styles = {
  page: 'flex flex-col gap-10',
};

export function HomePage() {
  const {user} = useAuth();
  const allowed = flattenNavigation(filterNavigation(NAVIGATION, user?.permissions));
  const shortcuts = allowed.filter((item) => item.permission !== 'home');
  const canCashier = shortcuts.some((item) => item.permission === 'caja');
  const canKitchen = shortcuts.some((item) => item.permission === 'cocina');
  const summary = useDaySummary({canCashier, canKitchen});

  return (
    <div className={styles.page}>
      <WelcomeCard name={user?.nombre} />
      {(canCashier || canKitchen) && <DaySummary summary={summary} showCashier={canCashier} showKitchen={canKitchen} />}
      {shortcuts.length > 0 && <QuickAccessGrid items={shortcuts} />}
    </div>
  );
}

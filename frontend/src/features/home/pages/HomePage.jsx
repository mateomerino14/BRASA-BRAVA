import {useAuth} from '../../../context/useAuth';
import {NAVIGATION, filterNavigation, flattenNavigation} from '../../../config/navigation';
import {WelcomeCard} from '../components/WelcomeCard';
import {QuickAccessGrid} from '../components/QuickAccessGrid';

const styles = {
  page: 'flex flex-col gap-10',
};

export function HomePage() {
  const {user} = useAuth();
  const allowed = flattenNavigation(filterNavigation(NAVIGATION, user?.permissions));
  const shortcuts = allowed.filter((item) => item.permission !== 'home');

  return (
    <div className={styles.page}>
      <WelcomeCard name={user?.nombre} />
      {shortcuts.length > 0 && <QuickAccessGrid items={shortcuts} />}
    </div>
  );
}

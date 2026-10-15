import {motion} from 'motion/react';
import {SocialIcon} from '../atoms/SocialIcon';
import {SOCIAL_LINKS} from '../../config/socialLinks';

const styles = {
  footer: 'flex flex-wrap items-center justify-between gap-3 bg-carbon px-4 py-3 text-crema sm:gap-4 sm:px-10 sm:py-4',
  copyright: 'text-xs font-semibold sm:text-base',
  list: 'flex gap-3 sm:gap-4',
  link: 'flex size-9 items-center sm:size-11 justify-center rounded-full bg-crema text-carbon transition-colors hover:bg-brasa hover:text-white',
};

const SOCIALS = [
  {name: 'facebook', label: 'Facebook'},
  {name: 'instagram', label: 'Instagram'},
  {name: 'tiktok', label: 'TikTok'},
];

const hoverTilt = {y: -3, rotate: -6};
const tapPress = {scale: 0.9};

export function Footer({links = SOCIAL_LINKS}) {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <p className={styles.copyright}>© {year} Brasa Brava · Todos los derechos reservados</p>
      <ul className={styles.list}>
        {SOCIALS.map(({name, label}) => (
          <li key={name}>
            <motion.a
              href={links[name]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} de Brasa Brava`}
              whileHover={hoverTilt}
              whileTap={tapPress}
              className={styles.link}
            >
              <SocialIcon name={name} size={20} />
            </motion.a>
          </li>
        ))}
      </ul>
    </footer>
  );
}

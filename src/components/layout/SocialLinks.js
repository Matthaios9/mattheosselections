import { PiFacebookLogo, PiInstagramLogo, PiTiktokLogo } from 'react-icons/pi';
import { siteConfig } from '@/config/site';
import styles from './SocialLinks.module.css';

const ICONS = { instagram: PiInstagramLogo, facebook: PiFacebookLogo, tiktok: PiTiktokLogo };

export default function SocialLinks({ light = false, className = '' }) {
  return (
    <ul className={`${styles.list} ${light ? styles.light : ''} ${className}`}>
      {siteConfig.socials.map((social) => {
        const Icon = ICONS[social.id];
        return (
          <li key={social.id}>
            <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className={styles.link}>
              <Icon aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

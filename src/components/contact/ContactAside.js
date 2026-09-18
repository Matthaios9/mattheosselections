import { PiEnvelopeSimple, PiGift } from 'react-icons/pi';
import SocialLinks from '@/components/layout/SocialLinks';
import { siteConfig } from '@/config/site';
import styles from './ContactAside.module.css';

export default function ContactAside({ copy }) {
  return (
    <div className={styles.aside}>
      <div className={styles.wholesale} id="wholesale">
        <span className={styles.wholesaleIcon}>
          <PiGift aria-hidden="true" />
        </span>
        <p className={styles.wholesaleTitle}>{copy.wholesale.title}</p>
        <p className={styles.wholesaleText}>{copy.wholesale.text}</p>
        <a href={`mailto:${siteConfig.email}?subject=${encodeURIComponent(copy.wholesale.title)}`} className="btn btn-ms-honey">
          <PiEnvelopeSimple className="btn-icon" aria-hidden="true" /> {copy.wholesale.cta}
        </a>
      </div>

      <div className={styles.social}>
        <div>
          <p className={styles.socialTitle}>{copy.social.title}</p>
          <p className={styles.socialText}>{copy.social.text}</p>
        </div>
        <SocialLinks />
      </div>
    </div>
  );
}

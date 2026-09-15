import { PiArrowUpRight, PiEnvelopeSimple, PiGift, PiMapPin } from 'react-icons/pi';
import SocialLinks from '@/components/layout/SocialLinks';
import { siteConfig } from '@/config/site';
import styles from './ContactAside.module.css';

export default function ContactAside({ copy }) {
  const { address, map } = siteConfig;

  return (
    <div className={styles.aside}>
      <div className={styles.mapCard}>
        <div className={styles.map}>
          <iframe
            title={copy.map.title}
            src={map.embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className={styles.mapInfo}>
          <div>
            <p className={styles.mapTitle}>{copy.map.title}</p>
            <p className={styles.mapAddress}>
              <PiMapPin aria-hidden="true" /> {address.street}, {address.postalCode} {address.city}
            </p>
            <p className={styles.mapNote}>{copy.map.note}</p>
          </div>
          <a href={map.directionsUrl} target="_blank" rel="noopener noreferrer" className={styles.directions}>
            {copy.map.directions} <PiArrowUpRight className="flip-rtl" aria-hidden="true" />
          </a>
        </div>
      </div>

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

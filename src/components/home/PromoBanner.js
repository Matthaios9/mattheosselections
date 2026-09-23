import Container from 'react-bootstrap/Container';
import { PiArrowRight, PiGift, PiSealCheck } from 'react-icons/pi';
import ButtonLink from '@/components/common/ButtonLink';
import CloudinaryImage from '@/components/common/CloudinaryImage';
import Reveal from '@/components/common/Reveal';
import { PHOTOS } from '@/config/photos';
import { formatPrice } from '@/utils/format';
import PromoAddButton from './PromoAddButton';
import styles from './PromoBanner.module.css';

/** Campaign band highlighting the flagship Naturbox gift set. */
export default function PromoBanner({ copy, product, href, locale }) {
  if (!product) return null;

  return (
    <section className="section">
      <Container>
        <Reveal className={styles.banner}>
          <div className={styles.copy}>
            <span className="eyebrow eyebrow-light">
              <PiGift aria-hidden="true" /> {copy.eyebrow}
            </span>
            <h2 className={styles.title}>{copy.title}</h2>
            <p className={styles.text}>{copy.text}</p>
            <ul className={styles.highlights}>
              {copy.highlights.map((item) => (
                <li key={item}>
                  <PiSealCheck aria-hidden="true" /> {item}
                </li>
              ))}
            </ul>
            <div className={styles.actions}>
              <ButtonLink
                href={product.categorySlug ? href(`/shop/${product.categorySlug}`) : href('/shop')}
                variant="ms-honey"
                size="lg"
              >
                {copy.primaryCta}
                <PiArrowRight className="btn-icon btn-icon-shift flip-rtl" aria-hidden="true" />
              </ButtonLink>
              <PromoAddButton product={product} label={`${copy.secondaryCta} · ${formatPrice(product.price, locale)}`} />
            </div>
          </div>

          <div className={styles.visual}>
            <CloudinaryImage
              src={PHOTOS.hiveWildComb}
              alt=""
              fill
              sizes="(min-width: 1400px) 660px, (min-width: 992px) 50vw, 100vw"
              className={styles.backdrop}
            />
            <figure className={styles.product}>
              <span className={styles.productImage}>
                <CloudinaryImage src={product.image} alt={product.name} fill sizes="(min-width: 992px) 300px, 60vw" className="img-cover" />
              </span>
              <figcaption className={styles.caption}>
                <span>{product.name}</span>
                <strong>{formatPrice(product.price, locale)}</strong>
              </figcaption>
            </figure>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

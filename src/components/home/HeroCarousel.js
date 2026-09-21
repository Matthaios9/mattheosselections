'use client';

import { useState } from 'react';
import Carousel from 'react-bootstrap/Carousel';
import CloudinaryImage from '@/components/common/CloudinaryImage';
import { HERO_SLIDES } from '@/config/home';
import { interpolate } from '@/i18n/translate';
import styles from './HeroSection.module.css';

/** The hero's arch: a slow crossfade through the producer photos, with dots to pick one. */
export default function HeroCarousel({ alt, slideLabel }) {
  const [index, setIndex] = useState(0);
  const total = HERO_SLIDES.length;

  return (
    <div className={styles.arch}>
      <Carousel
        activeIndex={index}
        onSelect={setIndex}
        fade
        controls={false}
        indicators={false}
        interval={5500}
        className={styles.carousel}
      >
        {HERO_SLIDES.map((slide, i) => (
          <Carousel.Item key={slide.src} className={styles.slide}>
            <CloudinaryImage
              src={slide.src}
              alt={`${alt} — ${interpolate(slideLabel, { index: i + 1, total })}`}
              fill
              preload={i === 0}
              quality={85}
              sizes="(min-width: 992px) 38vw, 86vw"
              className={styles.archImage}
              style={{ objectPosition: slide.position }}
            />
          </Carousel.Item>
        ))}
      </Carousel>

      {total > 1 && (
        <div className={styles.dots}>
          {HERO_SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
              onClick={() => setIndex(i)}
              aria-label={interpolate(slideLabel, { index: i + 1, total })}
              aria-current={i === index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

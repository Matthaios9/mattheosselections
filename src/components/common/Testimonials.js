'use client';

import { useState } from 'react';
import Image from 'next/image';
import Carousel from 'react-bootstrap/Carousel';
import Container from 'react-bootstrap/Container';
import { PiArrowLeft, PiArrowRight, PiQuotes } from 'react-icons/pi';
import Reveal from './Reveal';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './Testimonials.module.css';

/** Real customer quotes on a React-Bootstrap Carousel with custom controls. Reused on Home and About. */
export default function Testimonials({ className = 'bg-sand' }) {
  const { t } = useI18n();
  const items = t('home.testimonials.items');
  const [index, setIndex] = useState(0);

  const go = (step) => setIndex((current) => (current + step + items.length) % items.length);

  return (
    <section className={`section ${className}`}>
      <Container>
        <div className={styles.grid}>
          <Reveal className={styles.visual}>
            <div className={styles.image}>
              <Image src="/images/editorial/honey-hand-dipper.jpg" alt="" fill sizes="(min-width: 992px) 30vw, 80vw" className="img-cover" />
            </div>
            <span className={styles.quoteBadge} aria-hidden="true">
              <PiQuotes />
            </span>
          </Reveal>

          <Reveal className={styles.content} delay={120}>
            <span className="eyebrow">{t('home.testimonials.eyebrow')}</span>
            <h2 className="section-title">{t('home.testimonials.title')}</h2>
            <p className={styles.intro}>{t('home.testimonials.text')}</p>

            <Carousel
              activeIndex={index}
              onSelect={setIndex}
              controls={false}
              indicators={false}
              interval={7000}
              fade
              className={styles.carousel}
            >
              {items.map((item) => (
                <Carousel.Item key={item.name}>
                  <figure className={styles.slide}>
                    <blockquote className={styles.quote}>“{item.quote}”</blockquote>
                    <figcaption className={styles.author}>
                      <span className={styles.avatar} aria-hidden="true">
                        {item.name.charAt(0)}
                      </span>
                      <span>
                        <span className={styles.name}>{item.name}</span>
                        <span className={styles.meta}>{item.location}</span>
                      </span>
                    </figcaption>
                  </figure>
                </Carousel.Item>
              ))}
            </Carousel>

            <div className={styles.controls}>
              <button type="button" className={styles.control} onClick={() => go(-1)} aria-label={t('common.previous')}>
                <PiArrowLeft className="flip-rtl" />
              </button>
              <button type="button" className={styles.control} onClick={() => go(1)} aria-label={t('common.next')}>
                <PiArrowRight className="flip-rtl" />
              </button>
              <div className={styles.dots}>
                {items.map((item, i) => (
                  <button
                    key={item.name}
                    type="button"
                    className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
                    onClick={() => setIndex(i)}
                    aria-label={`${i + 1} / ${items.length}`}
                    aria-current={i === index}
                  />
                ))}
              </div>
              <span className={styles.counter}>
                {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
              </span>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

import Container from 'react-bootstrap/Container';
import { PiArrowRight } from 'react-icons/pi';
import ButtonLink from '@/components/common/ButtonLink';
import Reveal from '@/components/common/Reveal';
import SectionHeading from '@/components/common/SectionHeading';
import { interpolate } from '@/i18n/translate';
import CategoryCard from './CategoryCard';
import styles from './CategoryShowcase.module.css';

export default function CategoryShowcase({ copy, viewAllLabel, categories, href }) {
  if (!categories.length) return null;

  return (
    <section className="section pt-0">
      <Container>
        <Reveal>
          <SectionHeading
            align="split"
            eyebrow={copy.eyebrow}
            title={copy.title}
            text={copy.text}
            action={
              <ButtonLink href={href('/shop')} variant="ms-outline">
                {viewAllLabel}
                <PiArrowRight className="btn-icon btn-icon-shift flip-rtl" aria-hidden="true" />
              </ButtonLink>
            }
          />
        </Reveal>
        <div className={styles.grid}>
          {categories.map((category, index) => (
            <Reveal key={category.id} delay={index * 90} className={index === 0 ? styles.featuredCell : styles.cell}>
              <CategoryCard
                category={category}
                featured={index === 0}
                href={`${href('/shop')}?category=${category.id}`}
                countLabel={interpolate(category.count === 1 ? copy.countOne : copy.count, { count: category.count })}
                cta={copy.cta}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

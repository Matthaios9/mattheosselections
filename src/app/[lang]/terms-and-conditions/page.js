import Container from 'react-bootstrap/Container';
import PageHero from '@/components/common/PageHero';
import { siteConfig } from '@/config/site';
import { getTerms } from '@/content/terms';
import { localizePath } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import styles from './page.module.css';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  return { title: dict.meta.terms.title, description: dict.meta.terms.description };
}

/** The shop's email address inside a paragraph becomes a mailto link. */
function withEmailLink(text) {
  return text.split(siteConfig.email).flatMap((part, index) =>
    index === 0
      ? [part]
      : [
          <a key={index} href={`mailto:${siteConfig.email}`}>
            {siteConfig.email}
          </a>,
          part,
        ]
  );
}

function Block({ block }) {
  if (typeof block === 'string') return <p>{withEmailLink(block)}</p>;
  if (block.heading) return <h3 className={styles.subheading}>{block.heading}</h3>;
  if (block.list) {
    return (
      <ul>
        {block.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (block.lines) {
    return (
      <address className={styles.address}>
        {block.lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </address>
    );
  }
  return null;
}

export default async function TermsPage({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  const terms = getTerms(lang);

  return (
    <>
      <PageHero
        size="sm"
        image="/images/editorial/greece-meadow.jpg"
        eyebrow={terms.eyebrow}
        title={terms.title}
        breadcrumbs={[{ label: dict.nav.home, href: localizePath('/', lang) }, { label: dict.footer.terms }]}
      />
      <section className="section">
        <Container>
          <div className={styles.layout}>
            <nav className={styles.toc} aria-label={terms.contents}>
              <p className={styles.tocTitle}>{terms.contents}</p>
              <ol className={styles.tocList}>
                {terms.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.title}</a>
                  </li>
                ))}
              </ol>
            </nav>

            <article className={styles.article}>
              {terms.sections.map((section) => (
                <section key={section.id} id={section.id} className={styles.section}>
                  <h2 className={styles.heading}>{section.title}</h2>
                  {section.blocks.map((block, index) => (
                    <Block key={index} block={block} />
                  ))}
                </section>
              ))}
              <p className={styles.company}>{dict.footer.legal}</p>
            </article>
          </div>
        </Container>
      </section>
    </>
  );
}

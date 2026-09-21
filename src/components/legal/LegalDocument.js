import Link from 'next/link';
import Container from 'react-bootstrap/Container';
import { siteConfig } from '@/config/site';
import { localizePath } from '@/i18n/config';
import styles from './LegalDocument.module.css';

/**
 * A legal text (terms of sale, privacy policy) with a table of contents. `doc.sections` are
 * `{ id, title, blocks }`; a block is a paragraph (a string, or `{ text, links: [{ label, path }] }`
 * to turn words into links to other pages), `{ heading }`, `{ list: [] }` or `{ lines: [] }` (an address).
 * The shop's email address inside any paragraph becomes a mailto link.
 */
export default function LegalDocument({ doc, lang, footer }) {
  return (
    <section className="section">
      <Container>
        <div className={styles.layout}>
          <nav className={styles.toc} aria-label={doc.contents}>
            <p className={styles.tocTitle}>{doc.contents}</p>
            <ol className={styles.tocList}>
              {doc.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <article className={styles.article}>
            {doc.sections.map((section) => (
              <section key={section.id} id={section.id} className={styles.section}>
                <h2 className={styles.heading}>{section.title}</h2>
                {section.blocks.map((block, index) => (
                  <Block key={index} block={block} lang={lang} />
                ))}
              </section>
            ))}
            {footer && <p className={styles.company}>{footer}</p>}
          </article>
        </div>
      </Container>
    </section>
  );
}

/** Text with the shop's email address and the given labels turned into links. */
function withLinks(text, links = [], lang) {
  const targets = [
    { label: siteConfig.email, render: (key) => <a key={key} href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> },
    ...links.map(({ label, path }) => ({
      label,
      render: (key) => (
        <Link key={key} href={localizePath(path, lang)}>
          {label}
        </Link>
      ),
    })),
  ];
  return targets.reduce(
    (parts, target, t) =>
      parts.flatMap((part, i) =>
        typeof part === 'string'
          ? part.split(target.label).flatMap((piece, j) => (j === 0 ? [piece] : [target.render(`${t}-${i}-${j}`), piece]))
          : [part]
      ),
    [text]
  );
}

function Block({ block, lang }) {
  if (typeof block === 'string') return <p>{withLinks(block, [], lang)}</p>;
  if (block.text) return <p>{withLinks(block.text, block.links, lang)}</p>;
  if (block.heading) return <h3 className={styles.subheading}>{block.heading}</h3>;
  if (block.list) {
    return (
      <ul>
        {block.list.map((item) => (
          <li key={item}>{withLinks(item, [], lang)}</li>
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

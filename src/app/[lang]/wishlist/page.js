import Container from 'react-bootstrap/Container';
import PageHero from '@/components/common/PageHero';
import WishlistGrid from '@/components/product/WishlistGrid';
import { PHOTOS } from '@/config/photos';
import { localizePath } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pageMetadata } from '@/i18n/metadata';

/**
 * The saved products of whoever is looking. The list lives in their browser, so the page itself has
 * nothing personal in it — but there is nothing for a crawler to index either (everyone would see an
 * empty page), so it is kept out of search results and out of sitemap.js.
 */
export async function generateMetadata({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  return {
    ...pageMetadata({
      dict,
      locale: lang,
      path: '/wishlist',
      title: dict.meta.wishlist.title,
      description: dict.meta.wishlist.description,
    }),
    robots: { index: false, follow: true },
  };
}

export default async function WishlistPage({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  const copy = dict.wishlist;

  return (
    <>
      <PageHero
        size="sm"
        overlap
        image={PHOTOS.hivesChestnutGrove}
        imagePosition="50% 60%"
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        text={copy.hero.text}
        breadcrumbs={[{ label: dict.nav.home, href: localizePath('/', lang) }, { label: dict.nav.wishlist }]}
      />
      <section className="section">
        <Container>
          <WishlistGrid />
        </Container>
      </section>
    </>
  );
}

import BrandStory from '@/components/home/BrandStory';
import CategoryShowcase from '@/components/home/CategoryShowcase';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import HeroSection from '@/components/home/HeroSection';
import PromoBanner from '@/components/home/PromoBanner';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import Newsletter from '@/components/common/Newsletter';
import Testimonials from '@/components/common/Testimonials';
import { localizePath } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pageMetadata } from '@/i18n/metadata';
import { getSpotlightProducts, getStoreCategories, searchStoreProducts } from '@/server/domain/storefront';
import { withLiveStats } from '@/utils/stats';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  return pageMetadata({
    dict,
    locale: lang,
    path: '/',
    title: { absolute: `${dict.meta.siteName} — ${dict.meta.home.title}` },
    description: dict.meta.home.description,
  });
}

/** First tab of the "Featured" section: products flagged in the admin, or the best sellers if none are. */
async function loadFeatured(locale) {
  try {
    const featured = await searchStoreProducts({ locale, featured: true, sort: 'popularity', pageSize: 8 });
    if (featured.total > 0) return { tab: 'featured', items: featured.items };
    const all = await searchStoreProducts({ locale, sort: 'popularity', pageSize: 8 });
    return { tab: 'all', items: all.items };
  } catch (error) {
    console.error('[home] Could not load featured products:', error.message);
    return { tab: 'all', items: [] };
  }
}

export default async function HomePage({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  const href = (path) => localizePath(path, lang);

  // Hero card = product badged "Signature"; gifting banner = product badged "Gift favourite" (set in the admin).
  const [categories, spotlight, featured] = await Promise.all([
    getStoreCategories(lang),
    getSpotlightProducts(lang),
    loadFeatured(lang),
  ]);

  return (
    <>
      <HeroSection copy={dict.home.hero} href={href} product={spotlight.signature} />
      <CategoryShowcase copy={dict.home.categories} viewAllLabel={dict.nav.shopAll} categories={categories} href={href} />
      <FeaturedProducts initial={featured} />
      <PromoBanner copy={dict.home.promo} product={spotlight.gift} href={href} locale={lang} />
      <WhyChooseUs copy={dict.home.why} />
      <BrandStory copy={{ ...dict.home.story, stats: withLiveStats(dict.home.story.stats, categories) }} href={href} />
      <Testimonials />
      <Newsletter />
    </>
  );
}

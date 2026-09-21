import MissionVision from '@/components/about/MissionVision';
import ProcessSteps from '@/components/about/ProcessSteps';
import ProducersSection from '@/components/about/ProducersSection';
import StatsBand from '@/components/about/StatsBand';
import StorySection from '@/components/about/StorySection';
import TrustSection from '@/components/about/TrustSection';
import ValuesGrid from '@/components/about/ValuesGrid';
import CtaBanner from '@/components/common/CtaBanner';
import PageHero from '@/components/common/PageHero';
import Testimonials from '@/components/common/Testimonials';
import { localizePath } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pageMetadata } from '@/i18n/metadata';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  return pageMetadata({ dict, locale: lang, path: '/about', title: dict.meta.about.title, description: dict.meta.about.description });
}

export default async function AboutPage({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  const href = (path) => localizePath(path, lang);
  const about = dict.about;

  return (
    <>
      <PageHero
        image="/images/editorial/greece-mountains.jpg"
        eyebrow={about.hero.eyebrow}
        title={about.hero.title}
        text={about.hero.text}
        breadcrumbs={[{ label: dict.nav.home, href: href('/') }, { label: dict.nav.about }]}
      />
      <StorySection copy={about.story} />
      <StatsBand stats={about.stats} />
      <MissionVision mission={about.mission} vision={about.vision} />
      <ValuesGrid copy={about.values} />
      <ProcessSteps copy={about.process} />
      <ProducersSection copy={about.producers} />
      <TrustSection copy={about.trust} />
      <Testimonials className="" />
      <CtaBanner
        image="/images/editorial/greece-meadow.jpg"
        title={about.cta.title}
        text={about.cta.text}
        primary={{ label: about.cta.primary, href: href('/shop') }}
        secondary={{ label: about.cta.secondary, href: href('/contact') }}
      />
    </>
  );
}

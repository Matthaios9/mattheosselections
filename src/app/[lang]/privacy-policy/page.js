import PageHero from '@/components/common/PageHero';
import LegalDocument from '@/components/legal/LegalDocument';
import { siteConfig } from '@/config/site';
import { getPrivacyPolicy } from '@/content/privacy';
import { localizePath } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pageMetadata } from '@/i18n/metadata';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  return pageMetadata({
    dict,
    locale: lang,
    path: siteConfig.privacyPath,
    title: dict.meta.privacy.title,
    description: dict.meta.privacy.description,
  });
}

export default async function PrivacyPolicyPage({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  const policy = getPrivacyPolicy(lang);

  return (
    <>
      <PageHero
        size="sm"
        image="/images/editorial/greece-meadow.jpg"
        eyebrow={policy.eyebrow}
        title={policy.title}
        text={policy.updated}
        breadcrumbs={[{ label: dict.nav.home, href: localizePath('/', lang) }, { label: dict.footer.privacy }]}
      />
      <LegalDocument doc={policy} lang={lang} footer={dict.footer.legal} />
    </>
  );
}

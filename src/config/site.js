/** Business details shown across the site (the privacy policy and terms repeat them in their own text). */
export const siteConfig = {
  name: 'Mattheos Selections',
  legalName: 'Pasver AB',
  orgNumber: '559053-2486',
  // The one canonical host. Every absolute URL (canonical, hreflang, sitemap, robots.txt, Open Graph,
  // JSON-LD, emails) is built from it. Vercel's domain settings redirect mattheosselections.com here (308).
  url: 'https://www.mattheosselections.com',
  // Customers are helped by email only — no phone line.
  email: 'info@mattheosselections.com',
  // Office and postal address. Not open to visitors: the shop is online only.
  address: {
    street: 'Ekfatsgatan 4',
    postalCode: '117 57',
    city: 'Stockholm',
  },
  // Terms and conditions of sale: linked in the footer and from Kustom Checkout.
  termsPath: '/terms-and-conditions',
  // Privacy policy: linked in the footer, from the terms and from account sign-up.
  privacyPath: '/privacy-policy',
  socials: [
    { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/mattheos_selections' },
    { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61575561185894' },
    { id: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@mattheosselections' },
  ],
};

export const storeConfig = {
  currency: 'SEK',
  currencySymbol: 'kr',
  // Product prices also show an approximate euro price: kr ÷ this (see formatEuro in src/utils/format.js).
  sekPerEuro: 10,
  shipping: {
    domestic: { fee: 69, freeOver: 799 },
    // The €25 / free over €179 European rates the terms and the FAQ promise, at sekPerEuro above.
    international: { fee: 290, freeOver: 1790 },
  },
  // Swedish VAT included in all prices, sent to Kustom Checkout per order line. Food (honey, olive oil)
  // is 6% from 1 April 2026 to 31 December 2027 (12% before and after) — confirm with the accountant.
  vatRate: 6,
  // Goods that aren't food — beeswax cream and other cosmetics — are sold at the standard rate.
  // Tick "Standard VAT" on such a product in the admin; everything else stays on the food rate above.
  standardVatRate: 25,
  // The welcome offer: this much off the goods on a signed-in customer's first order. Set to 0 to
  // switch it off everywhere — the checkout, the home page block and the discount all read it here.
  welcomeDiscountPercent: 10,
  // Sizes with this many units or fewer show "Only a few left" and appear as low stock in the admin.
  lowStockThreshold: 5,
  // The "Single-origin honeys" figure on the home and about pages is the number of products in this
  // category (Raw Honey), so it always matches the shop.
  singleOriginCategoryId: '6aad53a64bba984e6580dabb',
  // Products per shop page; with a small collection everything usually fits on the first page.
  shopPageSize: 24,
};

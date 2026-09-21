/**
 * Business details shown across the site. Values marked "placeholder" are not
 * published on the current WordPress site and should be confirmed with the client.
 */
export const siteConfig = {
  name: 'Mattheos Selections',
  legalName: 'Pasver AB',
  orgNumber: '559053-2486',
  url: 'https://mattheosselections.com',
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
  shippingFee: 69,
  freeShippingThreshold: 799,
  shipping: {
    domestic: { fee: 69, freeOver: 799 },
    // Approximates the site's €25 / free over €179 European rates — confirm with the client.
    international: { fee: 290, freeOver: 2000 },
  },
  // Swedish VAT included in all prices, sent to Kustom Checkout per order line. Food (honey, olive oil)
  // is 6% from 1 April 2026 to 31 December 2027 (12% before and after) — confirm with the accountant.
  vatRate: 6,
  // Sizes with this many units or fewer show "Only a few left" and appear as low stock in the admin.
  lowStockThreshold: 5,
  // The "Single-origin honeys" figure on the home and about pages is the number of products in this
  // category (Raw Honey), so it always matches the shop.
  singleOriginCategoryId: '6aad53a64bba984e6580dabb',
  // Products per shop page; with a small collection everything usually fits on the first page.
  shopPageSize: 24,
};

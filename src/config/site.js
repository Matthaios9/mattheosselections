/**
 * Business details shown across the site. Values marked "placeholder" are not
 * published on the current WordPress site and should be confirmed with the client.
 */
export const siteConfig = {
  name: 'Mattheos Selections',
  legalName: 'Pasver AB',
  orgNumber: '559053-2486',
  url: 'https://mattheosselections.com',
  email: 'info@mattheosselections.com',
  phone: '+46 70 174 06 50', // placeholder
  phoneHref: 'tel:+46701740650', // placeholder
  address: {
    street: 'Ekfatsgatan 4',
    postalCode: '117 57',
    city: 'Stockholm',
  },
  map: {
    lat: 59.30607,
    lng: 18.03467,
    embedUrl:
      'https://www.openstreetmap.org/export/embed.html?bbox=18.0226%2C59.3018%2C18.0467%2C59.3103&layer=mapnik&marker=59.30607%2C18.03467',
    directionsUrl: 'https://www.openstreetmap.org/?mlat=59.30607&mlon=18.03467#map=17/59.30607/18.03467',
  },
  // Purchase terms linked from Kustom Checkout — point this at a terms page once it exists.
  termsPath: '/contact',
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
  // Sizes with this many units or fewer show "Only N left" and appear as low stock in the admin.
  lowStockThreshold: 5,
  shopPageSize: 9,
};

/**
 * Real photos from our producers in Greece, hosted on Cloudinary.
 * Render them with CloudinaryImage so Cloudinary's CDN serves each one resized and compressed.
 */
const BASE = 'https://res.cloudinary.com/dbrxbvovs/image/upload';

export const PHOTOS = {
  producersWithFrames: `${BASE}/v1789980791/ecommerce/site/producers/producers-with-frames.jpg`,
  beekeepersBlueHives: `${BASE}/v1789980787/ecommerce/site/producers/beekeepers-blue-hives.jpg`,
  beekeeperWildflowers: `${BASE}/v1789980792/ecommerce/site/producers/beekeeper-wildflowers.jpg`,
  beekeepersSmoker: `${BASE}/v1789980793/ecommerce/site/producers/beekeepers-smoker.jpg`,
  beekeepersHillside: `${BASE}/v1789980794/ecommerce/site/producers/beekeepers-hillside.jpg`,
  beekeepingFamilyBw: `${BASE}/v1789980788/ecommerce/site/producers/beekeeping-family-bw.jpg`,
  hivesMountainRoad: `${BASE}/v1789980790/ecommerce/site/producers/hives-mountain-road.jpg`,
  hivesChestnutGrove: `${BASE}/v1789980792/ecommerce/site/producers/hives-chestnut-grove.jpg`,
  hiveWildComb: `${BASE}/v1789980789/ecommerce/site/producers/hive-wild-comb.jpg`,
};

/** 1200×630 crop for link previews (Open Graph). */
export const SHARE_IMAGE = `${BASE}/c_fill,g_auto,w_1200,h_630,q_auto,f_jpg/v1789980790/ecommerce/site/producers/hives-mountain-road.jpg`;

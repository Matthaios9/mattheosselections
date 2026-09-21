import { storeConfig } from '@/config/site';
import { interpolate } from '@/i18n/translate';

/**
 * Fill live figures into the marketing stats: `{singleOrigin}` becomes the number of products in the
 * single-origin honey category. A stat whose figure is unknown (e.g. the category was removed) is left out.
 */
export function withLiveStats(stats, categories) {
  const singleOrigin = categories.find((category) => category.id === storeConfig.singleOriginCategoryId)?.count;
  return stats
    .filter((stat) => !stat.value.includes('{singleOrigin}') || singleOrigin > 0)
    .map((stat) => ({ ...stat, value: interpolate(stat.value, { singleOrigin }) }));
}

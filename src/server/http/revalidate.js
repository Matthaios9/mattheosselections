import 'server-only';
import { revalidatePath } from 'next/cache';

/** Refresh every cached storefront page (all locales) and the sitemap after catalogue or stock changes. */
export function revalidateStorefront() {
  revalidatePath('/[lang]', 'layout');
  revalidatePath('/sitemap.xml');
}

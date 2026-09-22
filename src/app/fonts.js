import { EB_Garamond, Manrope } from 'next/font/google';

// Both families ship Greek glyphs, so all three languages render in the brand typefaces. `subsets` is only
// what is preloaded on every page: the Greek and Latin Extended files still load, through their
// unicode-range, on the pages that use those characters.
export const serif = EB_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

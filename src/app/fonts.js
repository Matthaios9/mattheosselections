import { EB_Garamond, Manrope } from 'next/font/google';

// Both families ship Greek glyphs, so all three languages render in the brand typefaces.
export const serif = EB_Garamond({
  subsets: ['latin', 'latin-ext', 'greek'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const sans = Manrope({
  subsets: ['latin', 'latin-ext', 'greek'],
  variable: '--font-sans',
  display: 'swap',
});

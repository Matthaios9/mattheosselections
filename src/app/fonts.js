import { EB_Garamond, Manrope } from 'next/font/google';

// Both families ship Greek glyphs, so all three languages render in the brand typefaces. The Greek and
// Latin Extended files load, through their unicode-range, only on the pages that use those characters.
// Not preloaded: the ~120 KB of font files competed with the CSS on slow mobile connections and held back
// the first paint of the hero text. With `swap` the text shows at once in the size-matched fallback font
// and switches to the brand font when it arrives, without moving the layout.
export const serif = EB_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
  preload: false,
});

export const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: false,
});

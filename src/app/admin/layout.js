import 'bootstrap/dist/css/bootstrap.min.css';
import '../globals.css';
import './admin.css';
import { sans, serif } from '../fonts';

export const metadata = {
  title: { default: 'Admin — Mattheos Selections', template: '%s — Mattheos Admin' },
  robots: { index: false, follow: false },
};

/** Separate root layout: the admin panel never loads the storefront chrome. */
export default function AdminRootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="admin-body">{children}</body>
    </html>
  );
}

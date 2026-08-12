import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata = {
  title: 'CUTM Mentor-Mentee Platform',
  description: 'Mentor-Mentee Platform for Centurion University of Technology and Management (NAAC / NIRF / NBA ready)',
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. QuillBot) often inject
    // attributes onto <html>/<body> before React hydrates, which is harmless noise.
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

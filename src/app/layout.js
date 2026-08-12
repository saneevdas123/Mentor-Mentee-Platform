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
    <html lang="en" className={outfit.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

import './globals.css';

export const metadata = {
  title: 'CUTM Mentor-Mentee Platform',
  description: 'Mentor-Mentee Platform for Centurion University of Technology and Management (NAAC / NIRF / NBA ready)',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

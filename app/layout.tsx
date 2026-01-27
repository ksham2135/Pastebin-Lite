import type { Metadata } from 'next';
import './layout.css';

export const metadata: Metadata = {
  title: 'Pastebin Lite',
  description: 'A production-ready pastebin application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header style={{ borderBottom: '1px solid #ccc', padding: '1rem' }}>
          <h1 style={{ margin: 0 }}>
            <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              Pastebin Lite
            </a>
          </h1>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

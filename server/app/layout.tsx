import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'STOCK AI Backend',
  description: 'WhatsApp + Voice Stock Manager for Rwanda',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

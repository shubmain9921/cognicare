import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CogniCare',
  description: 'Cognitive Care & Memory Support Platform',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#059669" />
      </head>
      <body>{children}</body>
    </html>
  );
}

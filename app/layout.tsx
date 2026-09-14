import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PDF AI Book Reader',
  description: 'AI-powered PDF Book Reader',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

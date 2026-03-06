import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'Tennis Match Tracker',
  robots: { index: false, follow: false }, // 全ページnoindex
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-800 font-sans min-h-screen">
        {/* ここで全ページ共通のナビゲーションメニューを呼び出しています */}
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 pb-24 pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}
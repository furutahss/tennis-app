'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const links = [
    { href: '/', label: '📊 分析' },
    { href: '/tournaments', label: '🏆 大会一覧' },
    { href: '/opponents', label: '👤 相手一覧' },
    { href: '/places', label: '📍 場所一覧' },
    { href: '/records', label: '🎾 戦績' },
  ];

  return (
    <nav className="bg-white shadow-sm mb-6 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex overflow-x-auto">
        {links.map(link => (
          <Link key={link.href} href={link.href} className={`px-6 py-4 whitespace-nowrap font-bold transition ${pathname === link.href ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/faq', label: 'FAQ' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 w-full border-b border-cyan-950 bg-[#080d19]/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-semibold text-cyan-300 hover:text-cyan-200 transition-colors">
          <span className="flex items-center justify-center rounded-lg bg-cyan-400 p-1.5 text-[#080d19]">
            <Lock size={16} strokeWidth={2} />
          </span>
          ForgeFind
        </Link>

        <div className="ml-auto flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-normal transition-all duration-300 ${
                  active
                    ? 'bg-cyan-400/10 text-white'
                    : 'text-[#abc3d3] hover:bg-cyan-400/10 hover:text-white'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

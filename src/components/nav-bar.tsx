'use client';

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavBarProps {
  locale: string;
}

export function NavBar({ locale }: NavBarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const otherLocale = locale === 'es' ? 'en' : 'es';
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-fondeo-green-800 hover:text-fondeo-green-700 transition-colors"
        >
          Fondeo
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language toggle */}
          <Link
            href={pathname}
            locale={otherLocale}
            className="text-sm text-gray-500 hover:text-fondeo-green-700 transition-colors px-2 py-1 rounded border border-gray-200 hover:border-fondeo-green-300"
          >
            {locale === 'es' ? 'English' : 'Español'}
          </Link>

          <SignedIn>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-600">
                {t('dashboard')}
              </Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-gray-600">
                {t('signIn')}
              </Button>
            </Link>
            <Link href="/apply">
              <Button
                size="sm"
                className="bg-fondeo-green-700 hover:bg-fondeo-green-800 text-white"
              >
                {t('apply')}
              </Button>
            </Link>
          </SignedOut>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md text-gray-600 hover:text-fondeo-green-700"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-2">
          <Link
            href={pathname}
            locale={otherLocale}
            className="block text-sm text-gray-500 py-2"
            onClick={() => setMobileOpen(false)}
          >
            {locale === 'es' ? 'English' : 'Español'}
          </Link>
          <SignedIn>
            <Link
              href="/dashboard"
              className="block text-sm text-gray-600 py-2"
              onClick={() => setMobileOpen(false)}
            >
              {t('dashboard')}
            </Link>
          </SignedIn>
          <SignedOut>
            <Link
              href="/sign-in"
              className="block text-sm text-gray-600 py-2"
              onClick={() => setMobileOpen(false)}
            >
              {t('signIn')}
            </Link>
            <Link
              href="/apply"
              className="block"
              onClick={() => setMobileOpen(false)}
            >
              <Button className="w-full bg-fondeo-green-700 hover:bg-fondeo-green-800 text-white">
                {t('apply')}
              </Button>
            </Link>
          </SignedOut>
        </div>
      )}
    </nav>
  );
}

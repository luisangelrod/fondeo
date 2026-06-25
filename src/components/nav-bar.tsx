'use client';

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { FondeoLogo } from './fondeo-logo';
import { ThemeToggle } from './theme-toggle';

interface NavBarProps {
  locale: string;
}

export function NavBar({ locale }: NavBarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const otherLocale = locale === 'es' ? 'en' : 'es';
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo — always visible */}
          <Link href="/">
            <FondeoLogo size={32} />
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language toggle */}
            <Link
              href={pathname}
              locale={otherLocale}
              className="text-sm text-gray-500 hover:text-fondeo-green-700 transition-colors px-2 py-1 rounded border border-gray-200 hover:border-fondeo-green-300 dark:text-gray-300 dark:hover:text-white dark:border-gray-700 dark:hover:border-gray-500"
            >
              {locale === 'es' ? 'English' : 'Español'}
            </Link>

            <ThemeToggle />

            <SignedIn>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 dark:hover:text-white">
                  {t('dashboard')}
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 dark:hover:text-white">
                  {t('signIn')}
                </Button>
              </Link>
              <Link href="/apply">
                <Button size="sm" className="bg-fondeo-green-700 hover:bg-fondeo-green-800 text-white">
                  {t('apply')}
                </Button>
              </Link>
            </SignedOut>
          </div>

          {/* Mobile right side — shown only on mobile */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 py-3 space-y-2">
            {/* Language toggle */}
            <Link
              href={pathname}
              locale={otherLocale}
              className="block text-sm text-gray-500 dark:text-gray-300 py-2 px-2"
              onClick={() => setMobileOpen(false)}
            >
              {locale === 'es' ? 'English' : 'Español'}
            </Link>

            <SignedIn>
              <Link
                href="/dashboard"
                className="block text-sm text-gray-600 dark:text-gray-300 py-2 px-2"
                onClick={() => setMobileOpen(false)}
              >
                {t('dashboard')}
              </Link>
            </SignedIn>

            <SignedOut>
              <Link
                href={`/${locale}/sign-in`}
                onClick={() => setMobileOpen(false)}
                className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
              >
                {t('signIn')}
              </Link>
              <Link
                href={`/${locale}/apply`}
                onClick={() => setMobileOpen(false)}
                className="w-full flex items-center justify-center px-4 py-3 border border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
              >
                {t('apply')}
              </Link>
            </SignedOut>
          </div>
        )}
      </div>
    </nav>
  );
}

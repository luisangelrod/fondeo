import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Link as LocaleLink } from '@/navigation'
import { ArrowRight, Shield, Zap, Users, CheckCircle } from 'lucide-react'

export default function HomePage() {
  const t = useTranslations()
  const locale = useLocale()
  const otherLocale = locale === 'es' ? 'en' : 'es'

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-fondeo-green-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="font-bold text-xl text-gray-900">Fondeo</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Language toggle */}
          <LocaleLink
            href="/"
            locale={otherLocale}
            className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg transition"
          >
            {t('hero.languageToggle')}
          </LocaleLink>
          <Link href="/apply" className="text-gray-600 hover:text-gray-900 text-sm">
            {t('nav.apply')}
          </Link>
          <Link
            href="/sign-in"
            className="text-sm bg-fondeo-green-700 text-white px-4 py-2 rounded-lg hover:bg-fondeo-green-800 transition"
          >
            {t('nav.signIn')}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm px-3 py-1 rounded-full mb-6">
            <CheckCircle size={14} />
            <span>{t('hero.badge')}</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            {t('hero.headline')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {t('hero.subheadline')}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 bg-fondeo-green-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-fondeo-green-800 transition"
            >
              {t('hero.cta')} <ArrowRight size={20} />
            </Link>
            <span className="text-sm text-gray-500">{t('hero.ctaSubtext')}</span>
          </div>
        </div>
      </section>

      {/* Trust / Social Proof Bar */}
      <section className="border-y border-gray-100 bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">500+</div>
              <div className="text-xs text-gray-500 mt-0.5">{t('stats.businesses')}</div>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200" />
            <div>
              <div className="text-2xl font-bold text-gray-900">$12M+</div>
              <div className="text-xs text-gray-500 mt-0.5">{t('stats.funded')}</div>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200" />
            <div>
              <div className="text-2xl font-bold text-gray-900">48 hrs</div>
              <div className="text-xs text-gray-500 mt-0.5">{t('stats.speed')}</div>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200" />
            <div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-xs text-gray-500 mt-0.5">{t('stats.spam')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">{t('pain.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: t('pain.p1Title'), desc: t('pain.p1Desc'), icon: '🏦' },
              { title: t('pain.p2Title'), desc: t('pain.p2Desc'), icon: '📵' },
              { title: t('pain.p3Title'), desc: t('pain.p3Desc'), icon: '📊' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">{t('howItWorks.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: t('howItWorks.step1Title'), desc: t('howItWorks.step1Desc'), icon: <Users size={24} className="text-fondeo-green-700" /> },
              { step: '02', title: t('howItWorks.step2Title'), desc: t('howItWorks.step2Desc'), icon: <Shield size={24} className="text-fondeo-green-700" /> },
              { step: '03', title: t('howItWorks.step3Title'), desc: t('howItWorks.step3Desc'), icon: <Zap size={24} className="text-fondeo-green-700" /> },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-fondeo-green-50 rounded-2xl mb-4">
                  {item.icon}
                </div>
                <div className="text-fondeo-green-700 font-mono text-sm mb-2">{item.step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Anti-spam promise */}
      <section className="bg-fondeo-green-700 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Shield size={40} className="text-white mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">{t('antiSpam.title')}</h2>
          <p className="text-fondeo-green-100 text-lg leading-relaxed">{t('antiSpam.desc')}</p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('hero.ctaBottom')}</h2>
          <p className="text-gray-600 mb-8">{t('hero.ctaBottomSub')}</p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 bg-fondeo-green-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-fondeo-green-800 transition"
          >
            {t('hero.ctaBottomBtn')} <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-fondeo-green-700 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="font-semibold text-gray-900">Fondeo</span>
          </div>
          <p className="text-xs text-gray-400">{t('footer.copy')}</p>
        </div>
      </footer>
    </main>
  )
}

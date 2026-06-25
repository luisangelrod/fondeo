export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isEs = locale === 'es'

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {isEs ? 'Política de Privacidad' : 'Privacy Policy'}
      </h1>
      <p className="text-sm text-gray-400 mb-10">
        {isEs ? 'Última actualización: junio 2026' : 'Last updated: June 2026'}
      </p>

      {/* Section 1 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '1. Información que recopilamos' : '1. Information We Collect'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs
            ? 'Recopilamos la siguiente información cuando usas Fondeo: nombre completo, correo electrónico, número de teléfono, nombre e industria del negocio, ingresos mensuales aproximados, rango de puntaje de crédito, propósito y monto del préstamo solicitado, y datos de transacciones bancarias (cuando conectas tu cuenta a través de Plaid).'
            : 'We collect the following information when you use Fondeo: full name, email address, phone number, business name and industry, approximate monthly revenue, credit score range, loan purpose and amount requested, and bank transaction data (when you connect your account via Plaid).'}
        </p>
      </section>

      {/* Section 2 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '2. Cómo usamos tu información' : '2. How We Use Your Information'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs
            ? 'Usamos tu información para: emparejarte con prestamistas que se ajusten a tu perfil financiero, generar una puntuación de elegibilidad (LendScore) mediante análisis automatizado de inteligencia artificial, mejorar nuestros algoritmos de coincidencia de manera interna, y contactarte sobre el estado de tu solicitud. Solo compartimos tu información con un prestamista específico cuando tú haces clic en "Aplicar con este prestamista".'
            : 'We use your information to: match you with lenders that fit your financial profile, generate an eligibility score (LendScore) through AI-powered automated analysis, improve our matching algorithms internally, and contact you about the status of your application. We only share your information with a specific lender when you click "Apply with this lender".'}
        </p>
      </section>

      {/* Section 3 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '3. Plaid y datos bancarios' : '3. Plaid and Bank Data'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          {isEs
            ? 'Usamos Plaid para acceder de forma segura a los datos de transacciones de tu cuenta bancaria cuando eliges conectar tu banco. Fondeo nunca almacena tus credenciales bancarias. Los datos de transacciones se usan únicamente para calcular tu LendScore y encontrar las mejores opciones de préstamo para tu negocio.'
            : 'We use Plaid to securely access your bank transaction data when you choose to connect your bank account. Fondeo never stores your banking credentials. Transaction data is used solely to calculate your LendScore and find the best loan options for your business.'}
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs ? 'Política de Privacidad de Plaid: ' : "Plaid's Privacy Policy: "}
          <a
            href="https://plaid.com/legal/#end-user-privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline"
          >
            https://plaid.com/legal/#end-user-privacy-policy
          </a>
        </p>
      </section>

      {/* Section 4 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '4. No vendemos tus datos personales' : '4. We Do Not Sell Your Personal Data'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs
            ? 'Fondeo no vende, alquila ni comercializa tu información personal ni tus datos financieros a terceros. Tu información solo se comparte con prestamistas específicos con tu consentimiento explícito, como se describe en la Sección 2.'
            : 'Fondeo does not sell, rent, or trade your personal information or financial data to third parties. Your information is only shared with specific lenders with your explicit consent, as described in Section 2.'}
        </p>
      </section>

      {/* Section 5 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '5. Seguridad de los datos' : '5. Data Security'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs
            ? 'Implementamos medidas técnicas y organizativas razonables para proteger tu información contra acceso no autorizado, pérdida o divulgación. Sin embargo, ningún sistema de transmisión de datos por Internet es completamente seguro.'
            : 'We implement reasonable technical and organizational measures to protect your information against unauthorized access, loss, or disclosure. However, no Internet data transmission system is completely secure.'}
        </p>
      </section>

      {/* Section 6 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '6. Tus derechos' : '6. Your Rights'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs
            ? 'Puedes solicitar acceso, corrección o eliminación de tu información personal en cualquier momento. También puedes solicitar que dejemos de procesar tus datos. Para ejercer estos derechos, contáctanos en la dirección indicada a continuación.'
            : 'You may request access, correction, or deletion of your personal information at any time. You may also request that we stop processing your data. To exercise these rights, contact us at the address below.'}
        </p>
      </section>

      {/* Contact */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '7. Contacto' : '7. Contact'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs
            ? 'Para preguntas sobre privacidad o para ejercer tus derechos, contáctanos en: '
            : 'For privacy inquiries or to exercise your rights, contact us at: '}
          <a href="mailto:privacy@fondeo.app" className="text-emerald-700 underline">
            privacy@fondeo.app
          </a>
        </p>
      </section>
    </main>
  )
}

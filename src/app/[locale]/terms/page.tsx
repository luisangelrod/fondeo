export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isEs = locale === 'es'

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {isEs ? 'Términos de Servicio' : 'Terms of Service'}
      </h1>
      <p className="text-sm text-gray-400 mb-10">
        {isEs ? 'Última actualización: junio 2026' : 'Last updated: June 2026'}
      </p>

      {/* Section 1 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '1. Descripción del servicio' : '1. Service Description'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs
            ? 'Fondeo es un servicio de referido de préstamos para pequeñas empresas. Fondeo NO es un prestamista. No otorgamos préstamos, no tomamos decisiones de crédito y no determinamos los términos de ningún préstamo. Nuestro servicio conecta a propietarios de negocios calificados con prestamistas de terceros que pueden ofrecer financiamiento.'
            : 'Fondeo is a loan referral service for small businesses. Fondeo is NOT a lender. We do not issue loans, make credit decisions, or determine the terms of any loan. Our service connects qualified business owners with third-party lenders who may offer financing.'}
        </p>
      </section>

      {/* Section 2 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '2. Sin garantía de aprobación' : '2. No Guarantee of Loan Approval'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs
            ? 'El uso de Fondeo no garantiza que recibirás una oferta de préstamo ni que serás aprobado por ningún prestamista. Todos los resultados de elegibilidad, LendScores y coincidencias de prestamistas son estimaciones informativas y no constituyen una oferta de crédito. Las decisiones finales de préstamo son tomadas exclusivamente por los prestamistas.'
            : 'Using Fondeo does not guarantee that you will receive a loan offer or be approved by any lender. All eligibility results, LendScores, and lender matches are informational estimates and do not constitute an offer of credit. Final loan decisions are made solely by the lenders.'}
        </p>
      </section>

      {/* Section 3 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '3. Exactitud de la información' : '3. Accuracy of Business Information'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs
            ? 'Al usar Fondeo, declaras y garantizas que toda la información sobre tu negocio que proporcionas —incluyendo ingresos, tiempo en operación, datos de contacto y detalles del préstamo— es verdadera, precisa, actual y completa. Proporcionar información falsa o engañosa puede resultar en la cancelación de tu solicitud y puede tener consecuencias legales.'
            : 'By using Fondeo, you represent and warrant that all business information you provide — including revenue, time in operation, contact details, and loan details — is true, accurate, current, and complete. Providing false or misleading information may result in cancellation of your application and may have legal consequences.'}
        </p>
      </section>

      {/* Section 4 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '4. Compensación por referidos' : '4. Referral Compensation'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs
            ? 'Fondeo puede recibir una compensación de referido de los prestamistas cuando un préstamo es otorgado a un usuario que fue referido a través de nuestra plataforma. Esta compensación no afecta el orden en que se presentan los prestamistas ni los términos del préstamo que te ofrezcan.'
            : 'Fondeo may receive referral compensation from lenders when a loan is funded to a user referred through our platform. This compensation does not affect the order in which lenders are presented or the loan terms offered to you.'}
        </p>
      </section>

      {/* Section 5 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '5. No es asesoramiento financiero' : '5. Not Financial Advice'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs
            ? 'El contenido de Fondeo, incluyendo el LendScore, los resúmenes de elegibilidad y las coincidencias de prestamistas, es solo para fines informativos y no constituye asesoramiento financiero, legal o fiscal. Te recomendamos consultar a un asesor financiero calificado antes de tomar cualquier decisión de financiamiento.'
            : 'Content on Fondeo, including the LendScore, eligibility summaries, and lender matches, is for informational purposes only and does not constitute financial, legal, or tax advice. We recommend consulting a qualified financial advisor before making any financing decision.'}
        </p>
      </section>

      {/* Section 6 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '6. Ley aplicable' : '6. Governing Law'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs
            ? 'Estos términos se rigen e interpretan de acuerdo con las leyes del Estado Libre Asociado de Puerto Rico y las leyes federales de los Estados Unidos de América. Cualquier disputa que surja de o esté relacionada con estos términos estará sujeta a la jurisdicción exclusiva de los tribunales ubicados en Puerto Rico.'
            : 'These terms are governed by and construed in accordance with the laws of the Commonwealth of Puerto Rico and the federal laws of the United States of America. Any dispute arising from or related to these terms shall be subject to the exclusive jurisdiction of the courts located in Puerto Rico.'}
        </p>
      </section>

      {/* Section 7 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '7. Modificaciones' : '7. Modifications'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs
            ? 'Fondeo se reserva el derecho de modificar estos Términos de Servicio en cualquier momento. Los cambios serán publicados en esta página con una fecha de actualización revisada. El uso continuo del servicio después de los cambios constituye tu aceptación de los nuevos términos.'
            : 'Fondeo reserves the right to modify these Terms of Service at any time. Changes will be posted on this page with a revised update date. Your continued use of the service after changes constitutes your acceptance of the new terms.'}
        </p>
      </section>

      {/* Contact */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {isEs ? '8. Contacto legal' : '8. Legal Contact'}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          {isEs
            ? 'Para consultas legales relacionadas con estos términos, contáctanos en: '
            : 'For legal inquiries related to these terms, contact us at: '}
          <a href="mailto:legal@fondeo.app" className="text-emerald-700 underline">
            legal@fondeo.app
          </a>
        </p>
      </section>
    </main>
  )
}

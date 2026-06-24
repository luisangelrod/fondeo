import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Fondeo</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Financiamiento para negocios hispanos</p>
        </div>
        <SignIn
          appearance={{
            variables: { colorPrimary: '#059669', borderRadius: '0.75rem' },
          }}
        />
      </div>
    </div>
  )
}

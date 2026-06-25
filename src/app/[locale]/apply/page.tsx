import { ApplyForm } from './apply-form'

export default function ApplyPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="w-full max-w-xl mx-0 sm:mx-auto px-0 sm:px-0">
        {/* Minimal header — progress lives inside ApplyForm */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-fondeo-green-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">Fondeo</span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">2 min · No afecta tu crédito</p>
        </div>
        <ApplyForm />
      </div>
    </main>
  )
}

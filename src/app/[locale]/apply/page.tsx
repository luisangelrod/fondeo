import { ApplyForm } from './apply-form'

export default function ApplyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Minimal header — progress lives inside ApplyForm */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-fondeo-green-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Fondeo</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">2 min · No afecta tu crédito</p>
        </div>
        <ApplyForm />
      </div>
    </main>
  )
}

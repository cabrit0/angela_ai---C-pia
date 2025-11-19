import React, { useState } from 'react'
import AudioNarrator from './AudioNarrator'

interface SupportTextProps {
  supportText?: string
  onStartQuiz: () => void
}

const SupportText: React.FC<SupportTextProps> = ({ supportText = '', onStartQuiz }) => {
  const [isVisible, setIsVisible] = useState(true)

  if (!supportText.trim()) {
    return null
  }

  const handleStartQuiz = () => {
    setIsVisible(false)
    setTimeout(() => {
      onStartQuiz()
    }, 300)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 mobile-safe-top mobile-safe-bottom">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden transform transition-all duration-300 scale-100 mobile-optimized-card">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 mobile-element-spacing">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mobile-stack">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mobile-heading">Informações de Suporte</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mobile-caption">
                  Utilize o botão abaixo para ouvir o texto em áudio.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mobile-element-spacing">
              <AudioNarrator text={supportText} label="Ouvir texto" variant="solid" className="whitespace-nowrap mobile-optimized-button" />
              <button
                onClick={handleStartQuiz}
                className="mobile-optimized-button mobile-pressable text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 mobile-focus-visible"
                aria-label="Fechar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[50vh] mobile-element-spacing">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed mobile-body-text">{supportText}</div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 mobile-element-spacing">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400 mobile-caption">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Leia atentamente as informações acima. Elas podem ajudar você a responder melhor às perguntas.
            </p>
            <button
              onClick={handleStartQuiz}
              className="mobile-optimized-button mobile-pressable px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mobile-focus-visible"
            >
              Começar Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupportText

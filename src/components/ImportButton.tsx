import React, { useRef, useState } from 'react'
import type { Quiz } from '../types'
import { importQuizFromFile, importMultipleQuizzesFromFile } from '../lib/utils/importExport'

interface ImportButtonProps {
  onImport: (quizzes: Quiz[]) => void
  onError?: (error: string) => void
  variant?: 'single' | 'multiple'
  className?: string
}

export const ImportButton: React.FC<ImportButtonProps> = ({
  onImport,
  onError,
  variant = 'single',
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    try {
      let quizzes: Quiz[] = []

      if (variant === 'single') {
        // Importar um único quiz
        const quiz = await importQuizFromFile(file)
        quizzes = [quiz]
      } else {
        // Importar múltiplos quizzes
        quizzes = await importMultipleQuizzesFromFile(file)
      }

      onImport(quizzes)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao importar ficheiro'
      console.error('Erro ao importar quizzes:', error)
      
      if (onError) {
        onError(errorMessage)
      } else {
        alert(errorMessage)
      }
    } finally {
      setIsImporting(false)
      
      // Limpar o input para permitir selecionar o mesmo ficheiro novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getButtonText = () => {
    if (isImporting) {
      return variant === 'single' ? 'A importar...' : 'A importar quizzes...'
    }
    return variant === 'single' ? 'Importar Quiz' : 'Importar Quizzes'
  }

  const getAcceptAttribute = () => {
    return variant === 'single' ? '.quiz.json,.json' : '.quiz.json,.json'
  }

  return (
    <div className="inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptAttribute()}
        onChange={handleFileChange}
        className="hidden"
        disabled={isImporting}
      />
      
      <button
        onClick={handleButtonClick}
        disabled={isImporting}
        className={`
          inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
          shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
          focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <svg
          className={`mr-2 -ml-1 h-5 w-5 ${isImporting ? 'animate-spin' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          {isImporting ? (
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          ) : (
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          )}
        </svg>
        {getButtonText()}
      </button>
    </div>
  )
}

export default ImportButton
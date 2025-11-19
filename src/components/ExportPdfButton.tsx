import React, { useState } from 'react'
import type { Quiz } from '../types/quiz'
import { exportQuizToPdf, exportMultipleQuizzesToPdf } from '../lib/export/toPdf'

interface ExportPdfButtonProps {
  quiz: Quiz
  allQuizzes?: Quiz[]
  className?: string
}

/**
 * Botão de exportação de PDF:
 * - Exporta o quiz atual com layout completo (capa, texto de apoio, enunciado, soluções).
 * - Exporta todos os quizzes com sumário, cada quiz em nova página e soluções finais.
 * Por omissão, as soluções são incluídas no PDF gerado.
 */
export const ExportPdfButton: React.FC<ExportPdfButtonProps> = ({
  quiz,
  allQuizzes = [],
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState<'individual' | 'all' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [showTeacherDialog, setShowTeacherDialog] = useState(false)
  const [teacherName, setTeacherName] = useState('')
  const [pendingExportType, setPendingExportType] = useState<'individual' | 'all' | null>(null)

  // Exporta o quiz atual com o novo layout completo (inclui soluções no final)
  const handleExportIndividual = async () => {
    // Validate quiz ID before export
    if (!quiz.id || quiz.id === 'undefined' || quiz.id === 'null' || quiz.id.trim() === '') {
      console.error('[ExportPdfButton] Invalid quiz ID for PDF export:', quiz.id)
      setError('Não é possível exportar o quiz: ID inválido.')
      setTimeout(() => setError(null), 5000)
      return
    }
    
    console.log('[ExportPdfButton] Exporting quiz with ID to PDF:', quiz.id)
    setPendingExportType('individual')
    setShowTeacherDialog(true)
    setShowOptions(false)
  }

  // Exporta todos os quizzes com sumário inicial e soluções finais
  const handleExportAll = async () => {
    // Validate quiz ID before export
    if (!quiz.id || quiz.id === 'undefined' || quiz.id === 'null' || quiz.id.trim() === '') {
      console.error('[ExportPdfButton] Invalid quiz ID for PDF export all:', quiz.id)
      setError('Não é possível exportar o quiz: ID inválido.')
      setTimeout(() => setError(null), 5000)
      return
    }
    
    console.log('[ExportPdfButton] Exporting quiz with ID to PDF (all):', quiz.id)
    setPendingExportType('all')
    setShowTeacherDialog(true)
    setShowOptions(false)
  }

  // Executa a exportação após o nome do professor ser fornecido
  const executeExport = async () => {
    if (!pendingExportType) return

    try {
      setIsExporting(pendingExportType)
      setError(null)
      setSuccess(null)
      setShowTeacherDialog(false)

      await new Promise((resolve) => setTimeout(resolve, 300))

      if (pendingExportType === 'individual') {
        exportQuizToPdf(quiz, { includeAnswers: true, teacherName })
        setSuccess(
          'PDF do quiz exportado com sucesso (inclui capa, texto de apoio se existir, enunciado e secção de soluções no final).'
        )
      } else if (pendingExportType === 'all') {
        if (allQuizzes.length === 0) {
          setError('Não há quizzes para exportar.')
          return
        }
        exportMultipleQuizzesToPdf(allQuizzes, { includeAnswers: true, teacherName })
        setSuccess(
          'PDF com todos os quizzes exportado com sucesso (inclui sumário, cada quiz em página própria e secção de soluções no final).'
        )
      }

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
      setError('Não foi possível exportar o PDF. Tente novamente.')
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsExporting(null)
      setPendingExportType(null)
    }
  }

  // Cancela o diálogo de nome do professor
  const cancelTeacherDialog = () => {
    setShowTeacherDialog(false)
    setPendingExportType(null)
    setTeacherName('')
  }


  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        {/* Botão principal com menu de opções */}
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            disabled={isExporting !== null}
            className={`inline-flex items-center px-3 py-2 text-xs font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isExporting !== null
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
            }`}
            title="Exportar PDF estruturado do quiz"
          >
            {isExporting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                A exportar...
              </>
            ) : (
              <>
                <svg
                  className="mr-1 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Exportar PDF
                <svg
                  className="ml-1 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </>
            )}
          </button>

          {/* Menu de opções */}
          {showOptions && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-600 transition-colors duration-200">
              <div className="py-1">
                <button
                  onClick={handleExportIndividual}
                  disabled={isExporting !== null}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isExporting === 'individual' ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      A exportar...
                    </span>
                  ) : (
                    'Exportar este quiz (layout completo)'
                  )}
                </button>
                <button
                  onClick={handleExportAll}
                  disabled={isExporting !== null || allQuizzes.length === 0}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isExporting === 'all' ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      A exportar...
                    </span>
                  ) : (
                    `Exportar todos (${allQuizzes.length}) (layout completo)`
                  )}
                </button>
                <div className="px-4 py-2 text-[10px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                  O PDF é gerado em português de Portugal, com capa, texto de apoio (se existir),
                  enunciado das perguntas e secção de soluções no final, tanto para um só quiz como
                  para múltiplos quizzes.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diálogo para nome do professor */}
      {showTeacherDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Informação do Professor(a)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Por favor, indique o seu nome para aparecer na capa do PDF:
            </p>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="Nome do Professor(a)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={cancelTeacherDialog}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancelar
              </button>
              <button
                onClick={executeExport}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensagens de feedback */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 text-xs rounded-md z-10 transition-colors duration-200">
          {error}
        </div>
      )}

      {success && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 text-xs rounded-md z-10 transition-colors duration-200">
          {success}
        </div>
      )}
    </div>
  )
}

export default ExportPdfButton
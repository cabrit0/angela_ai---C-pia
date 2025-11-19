import React, { useEffect, useMemo, useState } from 'react'
import type { Question } from '../types'

interface MatchingQuestionProps {
  question: Question
  selectedAnswer: any
  onAnswerSelect: (answer: string) => void
}

const shuffleArray = (values: string[]) => {
  const arr = [...values]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const MatchingQuestion: React.FC<MatchingQuestionProps> = ({ question, selectedAnswer, onAnswerSelect }) => {
  const initialMatches = useMemo(() => {
    try {
      if (!selectedAnswer) return {}
      return typeof selectedAnswer === 'string' ? JSON.parse(selectedAnswer) : selectedAnswer
    } catch (error) {
      return {}
    }
  }, [selectedAnswer])

  const [matches, setMatches] = useState<{ [key: string]: string }>(initialMatches)
  const [activeLeftId, setActiveLeftId] = useState<string | null>(null)
  const [rightItems, setRightItems] = useState<string[]>([])

  useEffect(() => {
    if (question.matchingPairs) {
      const baseRight = question.matchingPairs.map(pair => pair.rightItem)
      setRightItems(shuffleArray(baseRight))
    }
    setMatches(initialMatches)
    setActiveLeftId(null)
  }, [question.id, question.matchingPairs, initialMatches])

  const handleMatch = (leftId: string, rightItem: string) => {
    const newMatches = { ...matches }

    Object.keys(newMatches).forEach(key => {
      if (newMatches[key] === rightItem) {
        delete newMatches[key]
      }
    })

    newMatches[leftId] = rightItem
    setMatches(newMatches)
    onAnswerSelect(JSON.stringify(newMatches))
  }

  const clearMatch = (leftId: string) => {
    const newMatches = { ...matches }
    delete newMatches[leftId]
    setMatches(newMatches)
    onAnswerSelect(JSON.stringify(newMatches))
  }

  if (!question.matchingPairs || question.matchingPairs.length === 0) {
    return <div className="text-red-500 dark:text-red-400">Nenhuma associação disponível</div>
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Selecione um item na coluna da esquerda e depois clique no item correspondente na coluna da direita. Use o botão Limpar para refazer pares.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="font-medium text-gray-700 dark:text-gray-300">Coluna Esquerda</h3>
          {question.matchingPairs.map(pair => {
            const isActive = activeLeftId === pair.id
            const hasMatch = Boolean(matches[pair.id])
            return (
              <div
                key={pair.id}
                className={`rounded-lg border p-3 transition-colors duration-200 ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : hasMatch
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveLeftId(isActive ? null : pair.id)}
                    className="text-left text-sm font-medium text-gray-900 dark:text-white flex-1"
                  >
                    {pair.leftItem}
                  </button>
                  {hasMatch && (
                    <button
                      type="button"
                      onClick={() => clearMatch(pair.id)}
                      className="ml-3 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                {matches[pair.id] && (
                  <div className="mt-2 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 text-sm text-gray-600 dark:text-gray-300">
                    {matches[pair.id]}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-gray-700 dark:text-gray-300">Coluna Direita</h3>
          {rightItems.map((item, index) => {
            const isUsed = Object.values(matches).includes(item)
            return (
              <button
                key={`${item}-${index}`}
                type="button"
                disabled={!activeLeftId || isUsed}
                onClick={() => activeLeftId && handleMatch(activeLeftId, item)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors duration-200 ${
                  isUsed
                    ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 cursor-not-allowed'
                    : activeLeftId
                    ? 'bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 cursor-not-allowed'
                }`}
              >
                {item}
                {isUsed && (
                  <span className="ml-2 text-xs text-gray-400">(uso)</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {Object.keys(matches).length > 0 && (
        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3 text-sm">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Associações atuais</h4>
          <div className="space-y-1 text-gray-700 dark:text-gray-200">
            {Object.entries(matches).map(([leftId, rightItem]) => {
              const leftPair = question.matchingPairs?.find(pair => pair.id === leftId)
              return (
                <div key={leftId}>
                  {leftPair?.leftItem} → {rightItem}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default MatchingQuestion

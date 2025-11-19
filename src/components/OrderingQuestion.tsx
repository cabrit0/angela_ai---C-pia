import React, { useEffect, useMemo, useState } from 'react'
import type { Question } from '../types'

interface OrderingQuestionProps {
  question: Question
  selectedAnswer: any
  onAnswerSelect: (answer: string) => void
}

const shuffle = (items: string[]) => {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const OrderingQuestion: React.FC<OrderingQuestionProps> = ({ question, selectedAnswer, onAnswerSelect }) => {
  const baseItems = useMemo(() => question.orderingItems || [], [question])

  const parseStoredOrder = () => {
    try {
      if (!selectedAnswer) return null
      const parsed = typeof selectedAnswer === 'string' ? JSON.parse(selectedAnswer) : selectedAnswer
      if (Array.isArray(parsed) && parsed.length === baseItems.length) {
        return parsed
      }
      return null
    } catch (error) {
      return null
    }
  }

  const [orderedItems, setOrderedItems] = useState<string[]>(() => parseStoredOrder() || shuffle(baseItems))

  useEffect(() => {
    const stored = parseStoredOrder()
    setOrderedItems(stored || shuffle(baseItems))
  }, [question.id, baseItems])

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= orderedItems.length) return
    const updated = [...orderedItems]
    ;[updated[index], updated[target]] = [updated[target], updated[index]]
    setOrderedItems(updated)
    onAnswerSelect(JSON.stringify(updated))
  }

  const resetOrder = () => {
    const shuffled = shuffle(baseItems)
    setOrderedItems(shuffled)
    onAnswerSelect(JSON.stringify(shuffled))
  }

  if (!question.orderingItems || question.orderingItems.length === 0) {
    return <div className="text-red-500 dark:text-red-400">Nenhum passo definido para esta pergunta.</div>
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Reorganize os itens na ordem correta usando os botões de seta. A sequência atual será guardada automaticamente.
      </p>
      <div className="space-y-3">
        {orderedItems.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 w-6 text-center">{index + 1}</span>
              <span className="text-gray-900 dark:text-white">{item}</span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
                className={`px-2 py-1 rounded ${index === 0 ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 'down')}
                disabled={index === orderedItems.length - 1}
                className={`px-2 py-1 rounded ${index === orderedItems.length - 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={resetOrder}
        className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200 rounded-md border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors duration-200"
      >
        Embaralhar novamente
      </button>
    </div>
  )
}

export default OrderingQuestion


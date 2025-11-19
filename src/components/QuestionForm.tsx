import React, { useEffect, useState } from 'react'
import type { Question, Choice, QType, MatchingPair } from '../types'
import { generateImageForQuestion } from '../lib/utils/autoImageGeneration'
import { loadSettings } from '../lib/utils/storage'

interface QuestionFormProps {
  initialData?: Question
  onSubmit: (data: Omit<Question, 'id'>) => void
  onCancel?: () => void
  autoGenerateImage?: boolean
}

const generateTempId = () => Math.random().toString(36).slice(2, 9)

type OrderingItem = { id: string; text: string }

const createDefaultPairs = (): MatchingPair[] => [
  { id: generateTempId(), leftItem: '', rightItem: '' },
  { id: generateTempId(), leftItem: '', rightItem: '' }
]

const createDefaultOrdering = (): OrderingItem[] => [
  { id: generateTempId(), text: '' },
  { id: generateTempId(), text: '' },
  { id: generateTempId(), text: '' }
]

const QuestionForm: React.FC<QuestionFormProps> = ({ initialData, onSubmit, onCancel, autoGenerateImage = true }) => {
  const [type, setType] = useState<QType>(initialData?.type || 'mcq')
  const [prompt, setPrompt] = useState(initialData?.prompt || '')
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '')
  const [answer, setAnswer] = useState(initialData?.answer || '')
  const [choices, setChoices] = useState<Choice[]>(
    initialData?.choices || [
      { id: '1', text: '', correct: false },
      { id: '2', text: '', correct: false },
      { id: '3', text: '', correct: false },
      { id: '4', text: '', correct: false }
    ]
  )
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>(
    initialData?.matchingPairs && initialData.matchingPairs.length > 0
      ? initialData.matchingPairs.map(pair => ({
          id: pair.id || generateTempId(),
          leftItem: pair.leftItem,
          rightItem: pair.rightItem
        }))
      : createDefaultPairs()
  )
  const [orderingItems, setOrderingItems] = useState<OrderingItem[]>(
    initialData?.orderingItems && initialData.orderingItems.length > 0
      ? initialData.orderingItems.map((text, index) => ({
          id: `${initialData?.id || 'ordering'}-${index}`,
          text
        }))
      : createDefaultOrdering()
  )

  useEffect(() => {
    if (type === 'truefalse') {
      setChoices([
        { id: 'true', text: 'Verdadeiro', correct: false },
        { id: 'false', text: 'Falso', correct: false }
      ])
    } else if (type === 'mcq' && choices.length < 4) {
      setChoices([
        { id: generateTempId(), text: '', correct: false },
        { id: generateTempId(), text: '', correct: false },
        { id: generateTempId(), text: '', correct: false },
        { id: generateTempId(), text: '', correct: false }
      ])
    }
  }, [type])

  useEffect(() => {
    if (type === 'matching' && matchingPairs.length < 2) {
      setMatchingPairs(prev => {
        const copy = [...prev]
        while (copy.length < 2) {
          copy.push({ id: generateTempId(), leftItem: '', rightItem: '' })
        }
        return copy
      })
    }
  }, [type, matchingPairs.length])

  useEffect(() => {
    if (type === 'ordering' && orderingItems.length < 3) {
      setOrderingItems(prev => {
        const copy = [...prev]
        while (copy.length < 3) {
          copy.push({ id: generateTempId(), text: '' })
        }
        return copy
      })
    }
  }, [type, orderingItems.length])

  const handleChoiceChange = (id: string, text: string) => {
    setChoices(choices.map(choice => (choice.id === id ? { ...choice, text } : choice)))
  }

  const handleCorrectChange = (id: string) => {
    setChoices(choices.map(choice => (choice.id === id ? { ...choice, correct: true } : { ...choice, correct: false })))
  }

  const addChoice = () => {
    if (choices.length < 6) {
      setChoices([...choices, { id: Date.now().toString(), text: '', correct: false }])
    }
  }

  const removeChoice = (id: string) => {
    if (choices.length > 2) {
      setChoices(choices.filter(choice => choice.id !== id))
    }
  }

  const handlePairChange = (pairId: string, field: 'leftItem' | 'rightItem', value: string) => {
    setMatchingPairs(prev => prev.map(pair => (pair.id === pairId ? { ...pair, [field]: value } : pair)))
  }

  const addPair = () => {
    setMatchingPairs(prev => [...prev, { id: generateTempId(), leftItem: '', rightItem: '' }])
  }

  const removePair = (pairId: string) => {
    if (matchingPairs.length > 2) {
      setMatchingPairs(prev => prev.filter(pair => pair.id !== pairId))
    }
  }

  const handleOrderingTextChange = (itemId: string, value: string) => {
    setOrderingItems(prev => prev.map(item => (item.id === itemId ? { ...item, text: value } : item)))
  }

  const moveOrderingItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= orderingItems.length) return
    const updated = [...orderingItems]
    ;[updated[index], updated[target]] = [updated[target], updated[index]]
    setOrderingItems(updated)
  }

  const addOrderingItem = () => {
    if (orderingItems.length < 8) {
      setOrderingItems(prev => [...prev, { id: generateTempId(), text: '' }])
    }
  }

  const removeOrderingItem = (itemId: string) => {
    if (orderingItems.length > 3) {
      setOrderingItems(prev => prev.filter(item => item.id !== itemId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim()) {
      alert('O enunciado da pergunta é obrigatório')
      return
    }

    if (type === 'mcq') {
      const hasCorrectChoice = choices.some(choice => choice.correct)
      const hasAllText = choices.every(choice => choice.text.trim())
      if (!hasAllText) {
        alert('Todas as opções devem ter texto')
        return
      }
      if (!hasCorrectChoice) {
        alert('Marque uma opção como correta')
        return
      }
    }

    if (type === 'truefalse') {
      const hasCorrectChoice = choices.some(choice => choice.correct)
      if (!hasCorrectChoice) {
        alert('Marque uma opção como correta')
        return
      }
    }

    if ((type === 'short' || type === 'gapfill' || type === 'essay') && !answer.trim()) {
      alert('A resposta correta é obrigatória para este tipo de pergunta')
      return
    }

    if (type === 'matching') {
      const hasValidPairs = matchingPairs.every(pair => pair.leftItem.trim() && pair.rightItem.trim())
      if (!hasValidPairs) {
        alert('Preencha todos os pares de associação com itens válidos')
        return
      }
    }

    if (type === 'ordering') {
      const normalizedOrdering = orderingItems.map(item => item.text.trim())
      if (normalizedOrdering.some(text => !text)) {
        alert('Preencha todos os passos da pergunta de ordenação')
        return
      }
      if (normalizedOrdering.length < 3) {
        alert('Adicione pelo menos 3 passos para a pergunta de ordenação')
        return
      }
    }

    let finalImageUrl = imageUrl.trim() || undefined

    if (autoGenerateImage && !finalImageUrl) {
      try {
        const settings = loadSettings()
        const tempQuestion: Question = {
          id: 'temp',
          type,
          prompt: prompt.trim()
        } as Question

        if (type === 'short' || type === 'gapfill' || type === 'essay') {
          tempQuestion.answer = answer.trim()
        } else if (type === 'matching') {
          tempQuestion.matchingPairs = matchingPairs
        } else if (type === 'ordering') {
          tempQuestion.orderingItems = orderingItems.map(item => item.text.trim())
        } else {
          tempQuestion.choices = choices
        }

        const generatedImageUrl = await generateImageForQuestion(
          tempQuestion,
          undefined,
          settings.imageProvider,
          settings.imageProvider === 'huggingface'
            ? settings.huggingFaceToken
            : settings.imageProvider === 'mistral'
            ? settings.mistralToken
            : undefined
        )

        if (generatedImageUrl) {
          finalImageUrl = generatedImageUrl
        }
      } catch (error) {
        console.error('Error auto-generating image:', error)
      }
    }

    const questionData: Omit<Question, 'id'> = {
      type,
      prompt: prompt.trim(),
      imageUrl: finalImageUrl
    }

    if (type === 'short' || type === 'gapfill' || type === 'essay') {
      questionData.answer = answer.trim()
    } else if (type === 'matching') {
      questionData.matchingPairs = matchingPairs.map(pair => ({
        id: pair.id || generateTempId(),
        leftItem: pair.leftItem.trim(),
        rightItem: pair.rightItem.trim()
      }))
    } else if (type === 'ordering') {
      questionData.orderingItems = orderingItems.map(item => item.text.trim())
      questionData.answer = questionData.orderingItems.join(' -> ')
    } else {
      questionData.choices = choices
    }

    onSubmit(questionData)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        {initialData ? 'Editar Pergunta' : 'Adicionar Pergunta'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Pergunta
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as QType)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <option value="mcq">Múltipla Escolha</option>
            <option value="truefalse">Verdadeiro/Falso</option>
            <option value="short">Resposta Curta</option>
            <option value="gapfill">Preencher Lacuna</option>
            <option value="essay">Resposta Discursiva</option>
            <option value="matching">Associação (Colunas)</option>
            <option value="ordering">Ordenação (Arrastar)</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enunciado *
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            placeholder="Digite o enunciado da pergunta"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL da Imagem (opcional)
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            placeholder="https://exemplo.com/imagem.jpg"
          />
        </div>

        {type === 'mcq' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Opções de Resposta
            </label>
            {choices.map((choice, index) => (
              <div key={choice.id} className="flex items-center mb-2">
                <input
                  type="radio"
                  name="correct-choice"
                  checked={choice.correct}
                  onChange={() => handleCorrectChange(choice.id)}
                  className="mr-2"
                />
                <input
                  type="text"
                  value={choice.text}
                  onChange={(e) => handleChoiceChange(choice.id, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2 transition-colors duration-200"
                  placeholder={`Opção ${index + 1}`}
                />
                {choices.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeChoice(choice.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}
            {choices.length < 6 && (
              <button
                type="button"
                onClick={addChoice}
                className="mt-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
              >
                Adicionar opção
              </button>
            )}
          </div>
        )}

        {type === 'truefalse' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resposta Correta
            </label>
            {choices.map(choice => (
              <div key={choice.id} className="flex items-center mb-2">
                <input
                  type="radio"
                  name="correct-choice"
                  checked={choice.correct}
                  onChange={() => handleCorrectChange(choice.id)}
                  className="mr-2"
                />
                <label className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200">
                  {choice.text}
                </label>
              </div>
            ))}
          </div>
        )}

        {(type === 'short' || type === 'gapfill' || type === 'essay') && (
          <div className="mb-4">
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {type === 'gapfill'
                ? 'Palavra/frase que completa a lacuna *'
                : type === 'essay'
                  ? 'Resposta modelo *'
                  : 'Resposta Correta *'}
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              placeholder={type === 'essay' ? 'Descreve a resposta esperada em 2-3 frases...' : 'Digite a resposta correta'}
              rows={2}
              required
            />
          </div>
        )}

        {type === 'matching' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pares de Associação *
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Preencha cada item da coluna esquerda e direita. Os alunos deverão relacionar os pares corretos.
            </p>
            <div className="space-y-3">
              {matchingPairs.map((pair, index) => (
                <div key={pair.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Esquerda {index + 1}</label>
                    <input
                      type="text"
                      value={pair.leftItem}
                      onChange={(e) => handlePairChange(pair.id, 'leftItem', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                      placeholder="Ex: Capital"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Direita {index + 1}</label>
                    <input
                      type="text"
                      value={pair.rightItem}
                      onChange={(e) => handlePairChange(pair.id, 'rightItem', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                      placeholder="Ex: País"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePair(pair.id)}
                    disabled={matchingPairs.length <= 2}
                    className={`px-3 py-2 rounded-md text-white transition-colors duration-200 ${matchingPairs.length <= 2 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    Remover
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addPair}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
              >
                Adicionar par
              </button>
            </div>
          </div>
        )}

        {type === 'ordering' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Passos para Ordenação *
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Os alunos precisarão reorganizar os itens abaixo na ordem correta. Adicione instruções claras e use os botões para reordenar os passos.
            </p>
            <div className="space-y-3">
              {orderingItems.map((item, index) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center sm:w-12 justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">{index + 1}.</span>
                    <div className="flex items-center gap-1 sm:flex-col">
                      <button
                        type="button"
                        onClick={() => moveOrderingItem(index, 'up')}
                        disabled={index === 0}
                        className={`px-2 py-1 rounded ${index === 0 ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOrderingItem(index, 'down')}
                        disabled={index === orderingItems.length - 1}
                        className={`px-2 py-1 rounded ${index === orderingItems.length - 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => handleOrderingTextChange(item.id, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                    placeholder="Descreva o passo"
                  />
                  <button
                    type="button"
                    onClick={() => removeOrderingItem(item.id)}
                    disabled={orderingItems.length <= 3}
                    className={`px-3 py-2 rounded-md text-white transition-colors duration-200 ${orderingItems.length <= 3 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={addOrderingItem}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
              >
                Adicionar passo
              </button>
              <button
                type="button"
                onClick={() => setOrderingItems(createDefaultOrdering())}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                Repor padrão
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          >
            {initialData ? 'Atualizar' : 'Adicionar'} Pergunta
          </button>
        </div>
      </form>
    </div>
  )
}

export default QuestionForm

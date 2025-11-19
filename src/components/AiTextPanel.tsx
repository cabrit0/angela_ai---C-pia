import React, { useState, useEffect } from 'react';
import type { QType, AiProvider, MatchingPair } from '../types';
import { generateQuestions, generateQuestionsWithImages, testProviderConnection } from '../lib/api/aiText';

const MIN_ORDERING_ITEMS = 3;
const MAX_ORDERING_ITEMS = 8;

type QuestionTypeOption = QType;

interface AiTextPanelProps {
  onQuestionsGenerated: (questions: any[]) => void;
  currentProvider: AiProvider;
  huggingFaceToken?: string;
  mistralToken?: string;
  quizId?: string;
  imageProvider?: AiProvider;
  huggingFaceImageToken?: string;
  mistralImageToken?: string;
  disciplinaFromQuiz?: string;
}

const normalizeOrderingEntry = (value: unknown): string => {
  if (value == null) return '';
  if (Array.isArray(value)) {
    return value.map(normalizeOrderingEntry).filter(Boolean).join(' • ');
  }
  if (typeof value === 'object') {
    const candidate =
      (value as Record<string, unknown>).text ??
      (value as Record<string, unknown>).value ??
      (value as Record<string, unknown>).answer ??
      (value as Record<string, unknown>).item ??
      (value as Record<string, unknown>).description ??
      '';
    return normalizeOrderingEntry(candidate);
  }
  return String(value).replace(/^[A-D]\)\s*/i, '').trim();
};

const getNormalizedOrderingItems = (items?: unknown[]): string[] => {
  const base = Array.isArray(items) ? items.map(normalizeOrderingEntry) : [];
  while (base.length < MIN_ORDERING_ITEMS) {
    base.push('');
  }
  return base.slice(0, MAX_ORDERING_ITEMS);
};

const extractAnswerText = (rawAnswer: unknown): string => {
  if (typeof rawAnswer === 'string') {
    return rawAnswer;
  }
  if (rawAnswer && typeof rawAnswer === 'object') {
    const candidates = rawAnswer as Record<string, unknown>;
    const value =
      candidates.text ??
      candidates.answer ??
      candidates.content ??
      candidates.value ??
      candidates.description;
    return typeof value === 'string' ? value : '';
  }
  return '';
};

const splitOrderingAnswer = (raw?: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw.map(normalizeOrderingEntry).filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw
      .split(/>|->|\u2192|\u2794|,|;/)
      .map(entry => normalizeOrderingEntry(entry))
      .filter(Boolean);
  }
  return [];
};

const prepareQuestionForEditing = (question: any) => {
  if (question.type === 'ordering') {
    const orderingSource =
      (Array.isArray(question.orderingItems) && question.orderingItems.length > 0
        ? question.orderingItems
        : splitOrderingAnswer(question.answer)) || [];
    return {
      ...question,
      orderingItems: getNormalizedOrderingItems(orderingSource)
    };
  }

  if (question.type === 'short' || question.type === 'gapfill' || question.type === 'essay') {
    return {
      ...question,
      answer: extractAnswerText(question.answer)
    };
  }

  return question;
};

const AiTextPanel: React.FC<AiTextPanelProps> = ({
  onQuestionsGenerated,
  currentProvider,
  huggingFaceToken,
  mistralToken,
  quizId,
  imageProvider,
  huggingFaceImageToken,
  mistralImageToken,
  disciplinaFromQuiz
}) => {
  // Tema usado para geração:
  // - Por defeito, herdado da Disciplina (disciplinaFromQuiz)
  // - Opcionalmente, o utilizador pode alterar manualmente
  const [topic, setTopic] = useState('');

  // Sincronizar automaticamente o Tema com a Disciplina quando:
  // - Ainda não existe tema definido (campo vazio)
  // - A prop disciplinaFromQuiz chega ou é atualizada
  useEffect(() => {
    const disciplina = (disciplinaFromQuiz || '').trim();
    if (!topic.trim() && disciplina) {
      setTopic(disciplina);
    }
  }, [disciplinaFromQuiz]);
  const [grade, setGrade] = useState('');
  const [questionType, setQuestionType] = useState<QuestionTypeOption>('mcq');
  const [questionCount, setQuestionCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [editingQuestions, setEditingQuestions] = useState<any[]>([]);
  const [providerStatus, setProviderStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [generateImages, setGenerateImages] = useState(true);

  // Opções de nível escolar
  const gradeOptions = [
    { value: '', label: 'Selecione o nível (opcional)' },
    { value: '1.º Ciclo', label: '1.º Ciclo (1.º-4.º ano)' },
    { value: '2.º Ciclo', label: '2.º Ciclo (5.º-6.º ano)' },
    { value: '3.º Ciclo', label: '3.º Ciclo (7.º-9.º ano)' },
    { value: 'Secundário', label: 'Ensino Secundário' },
    { value: 'Superior', label: 'Ensino Superior' },
    { value: 'Básico', label: 'Nível Básico' },
    { value: 'Intermédio', label: 'Nível Intermédio' },
    { value: 'Avançado', label: 'Nível Avançado' }
  ];

  // Verificar status do provedor ao montar o componente
  useEffect(() => {
    checkProviderStatus();
  }, [currentProvider, huggingFaceToken, mistralToken]);

  const checkProviderStatus = async () => {
    try {
      const token = currentProvider === 'huggingface' ? huggingFaceToken :
                    currentProvider === 'mistral' ? mistralToken : undefined;
      const status = await testProviderConnection(currentProvider, token);
      setProviderStatus(status);
    } catch (error) {
      setProviderStatus({
        success: false,
        message: 'Não foi possível verificar o estado do provedor.'
      });
    }
  };

  const handleGenerate = async () => {
    // NOVA REGRA:
    // Por defeito, o Tema deve ser o que está na Disciplina do quiz.
    // Implementação:
    // - Se Tema estiver vazio no momento do clique:
    //     * Usar disciplinaFromQuiz (se existir)
    //     * Caso contrário, tentar ler do localStorage ai_quiz_subject_${quizId}
    // - Se Tema já tiver um valor, respeitamos o valor manual do utilizador.
    // - Em todos os casos, usamos um finalTopic local e nunca dependemos do setState para o cálculo.
    const disciplinaFromProps = (disciplinaFromQuiz || '').trim();

    let disciplinaFromStorage = '';
    if (!disciplinaFromProps && quizId && typeof window !== 'undefined') {
      // Validate quizId before using it for localStorage access
      if (!quizId || quizId === 'undefined' || quizId === 'null' || quizId.trim() === '') {
        console.error('[AiTextPanel] Invalid quiz ID for localStorage access:', quizId);
      } else {
        console.log('[AiTextPanel] Accessing localStorage for quiz ID:', quizId);
        try {
          const stored = window.localStorage.getItem(`ai_quiz_subject_${quizId}`) || '';
          disciplinaFromStorage = stored.trim();
        } catch (error) {
          console.warn('Não foi possível ler a disciplina do quiz do localStorage para AI:', error);
        }
      }
    }

    const disciplina = disciplinaFromProps || disciplinaFromStorage;

    const currentTopic = (topic || '').trim();

    let finalTopic = currentTopic;

    // Se o utilizador não preencheu Tema, usar Disciplina por defeito
    if (!finalTopic && disciplina) {
      finalTopic = disciplina;
      // Atualizar imediatamente o input Tema para refletir o valor usado
      setTopic(disciplina);
    }

    if (!finalTopic) {
      setError('Por favor, indica um tema para as perguntas.');
      return;
    }

    if (!quizId) {
      setError('Erro: ID do quiz não encontrado. Por favor, guarda primeiro as informações do quiz.');
      return;
    }

    if (currentProvider === 'huggingface' && !huggingFaceToken) {
      setError('É necessário definir o token do Hugging Face nas Definições para usar este provedor.');
      return;
    }

    if (currentProvider === 'mistral' && !mistralToken) {
      setError('É necessário definir a chave de API do Mistral nas Definições para usar este provedor.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    // NÃ£o mostrar o aviso de privacidade durante a geraÃ§Ã£o

    try {
      const token = currentProvider === 'huggingface' ? huggingFaceToken :
                    currentProvider === 'mistral' ? mistralToken : undefined;
      
      // Determine image token based on image provider
      const imageToken = imageProvider === 'huggingface' ? huggingFaceImageToken :
                       imageProvider === 'mistral' ? mistralImageToken : undefined;
      
      let questions;
      if (generateImages) {
        // Always use Pollinations for image generation if no image provider is specified
        const finalImageProvider: AiProvider = imageProvider || 'pollinations';
        if (finalImageProvider) {
          console.log('Generating questions with images using provider:', finalImageProvider);
          console.log('Image token available:', !!imageToken);
          
          // Check if we have the required token for the selected image provider
          // Pollinations doesn't require a token, so it's always valid
          const hasValidImageToken = finalImageProvider === 'pollinations' ||
                                  (finalImageProvider === 'huggingface' && imageToken) ||
                                  (finalImageProvider === 'mistral' && imageToken);
          
          console.log('Image provider validation:', { finalImageProvider, hasValidImageToken, imageToken: !!imageToken });
          
          if (hasValidImageToken) {
            // Generate questions with images
            questions = await generateQuestionsWithImages({
              provider: currentProvider,
              topic: finalTopic,
              grade: grade || undefined,
              questionType,
              count: questionCount,
              token
            }, finalImageProvider, imageToken);
          } else {
            console.log('Image generation requested but no valid token for image provider:', finalImageProvider);
            // Since we're using Pollinations as default and it doesn't require a token,
            // we should always proceed with image generation
            if ((finalImageProvider as any) === 'pollinations') {
              console.log('Using Pollinations which does not require a token - proceeding with image generation');
              // Generate questions with images using Pollinations
              questions = await generateQuestionsWithImages({
                provider: currentProvider,
                topic: finalTopic,
                grade: grade || undefined,
                questionType,
                count: questionCount,
                token
              }, finalImageProvider, imageToken);
            } else {
              setError(`É necessário configurar um token para o provedor de imagens ${finalImageProvider}. Abre as Definições e adiciona o token.`);
              // Generate questions without images as fallback
              questions = await generateQuestions({
                provider: currentProvider,
                topic: finalTopic,
                grade: grade || undefined,
                questionType,
                count: questionCount,
                token
              });
            }
            // Generate questions without images as fallback
            questions = await generateQuestions({
              provider: currentProvider,
              topic: finalTopic,
              grade: grade || undefined,
              questionType,
              count: questionCount,
              token
            });
          }
        } else {
          console.log('Image generation requested but no image provider available');
          setError('Nenhum provedor de imagens configurado. Abre as Definições e escolhe um provedor de imagens ou desativa esta opção.');
          // Generate questions without images as fallback
          questions = await generateQuestions({
            provider: currentProvider,
            topic: finalTopic,
            grade: grade || undefined,
            questionType,
            count: questionCount,
            token
          });
        }
      } else {
        // Generate questions without images
        questions = await generateQuestions({
          provider: currentProvider,
          topic: finalTopic,
          grade: grade || undefined,
          questionType,
          count: questionCount,
          token
        });
      }

      if (!questions || questions.length === 0) {
        setError('Não foi possível gerar perguntas. Tenta novamente com um tema mais específico ou outro provedor.');
        return;
      }

      setGeneratedQuestions(questions);
      setEditingQuestions(questions.map(prepareQuestionForEditing));
    } catch (error) {
      // Show user-friendly error messages instead of technical details
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocorreu um erro ao gerar perguntas. Tenta novamente.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuestionEdit = (index: number, field: string, value: any) => {
    const updatedQuestions = [...editingQuestions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setEditingQuestions(updatedQuestions);
  };

  const handleChoiceEdit = (questionIndex: number, choiceIndex: number, field: string, value: any) => {
    const updatedQuestions = [...editingQuestions];
    const choices = [...updatedQuestions[questionIndex].choices];
    choices[choiceIndex] = { ...choices[choiceIndex], [field]: value };
    updatedQuestions[questionIndex].choices = choices;
    setEditingQuestions(updatedQuestions);
  };

  const getOrderingItemsForEdit = (questionIndex: number): string[] => {
    const current = editingQuestions[questionIndex]?.orderingItems;
    return getNormalizedOrderingItems(Array.isArray(current) ? current : []);
  };

  const updateOrderingItems = (questionIndex: number, nextItems: string[]) => {
    const limited = nextItems.slice(0, MAX_ORDERING_ITEMS);
    const normalized = getNormalizedOrderingItems(limited);
    const updatedQuestions = [...editingQuestions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      orderingItems: normalized
    };
    setEditingQuestions(updatedQuestions);
  };

  const handleOrderingItemChange = (questionIndex: number, itemIndex: number, value: string) => {
    const items = getOrderingItemsForEdit(questionIndex);
    items[itemIndex] = value;
    updateOrderingItems(questionIndex, items);
  };

  const handleOrderingItemMove = (questionIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    const items = getOrderingItemsForEdit(questionIndex);
    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) {
      return;
    }
    [items[itemIndex], items[targetIndex]] = [items[targetIndex], items[itemIndex]];
    updateOrderingItems(questionIndex, items);
  };

  const handleOrderingItemAdd = (questionIndex: number) => {
    const items = getOrderingItemsForEdit(questionIndex);
    if (items.length >= MAX_ORDERING_ITEMS) {
      return;
    }
    items.push('');
    updateOrderingItems(questionIndex, items);
  };

  const handleOrderingItemRemove = (questionIndex: number, itemIndex: number) => {
    const items = getOrderingItemsForEdit(questionIndex);
    if (items.length <= MIN_ORDERING_ITEMS) {
      return;
    }
    items.splice(itemIndex, 1);
    updateOrderingItems(questionIndex, items);
  };

  const handleAddToQuiz = () => {
    if (editingQuestions.length === 0) return;

    const sanitizedQuestions: any[] = [];

    editingQuestions.forEach((rawQuestion) => {
      const question = { ...rawQuestion };

      if (!question.prompt || !question.type) {
        return;
      }

      if (question.type === 'mcq' || question.type === 'truefalse') {
        const hasChoices = Array.isArray(question.choices) && question.choices.length > 0;
        const hasCorrect = hasChoices && question.choices!.some((choice: any) => choice.correct);
        if (!hasChoices || !hasCorrect) {
          return;
        }
        sanitizedQuestions.push(question);
        return;
      }

      if (question.type === 'short' || question.type === 'gapfill' || question.type === 'essay') {
        const answerText = extractAnswerText(question.answer).trim();
        if (!answerText) {
          return;
        }
        sanitizedQuestions.push({
          ...question,
          answer: answerText
        });
        return;
      }

      if (question.type === 'matching') {
        const pairs: MatchingPair[] = Array.isArray(question.matchingPairs)
          ? (question.matchingPairs as MatchingPair[])
          : [];
        const validPairs = pairs
          .map(pair => ({
            leftItem: (pair?.leftItem || '').trim(),
            rightItem: (pair?.rightItem || '').trim()
          }))
          .filter(pair => pair.leftItem && pair.rightItem);

        if (validPairs.length === 0) {
          return;
        }

        sanitizedQuestions.push({
          ...question,
          matchingPairs: validPairs
        });
        return;
      }

      if (question.type === 'ordering') {
        const orderingSource: unknown[] = Array.isArray(question.orderingItems)
          ? question.orderingItems
          : [];
        const orderingItems = orderingSource
          .map(item => normalizeOrderingEntry(item))
          .filter(Boolean)
          .slice(0, MAX_ORDERING_ITEMS);

        if (orderingItems.length < MIN_ORDERING_ITEMS) {
          return;
        }

        sanitizedQuestions.push({
          ...question,
          orderingItems,
          answer: orderingItems.join(' -> ')
        });
        return;
      }
    });

    if (sanitizedQuestions.length === 0) {
      setError('Não foi possível adicionar as perguntas. Verifica se todas têm enunciado e resposta correta preenchida.');
      return;
    }

    if (sanitizedQuestions.length < editingQuestions.length && editingQuestions.length - sanitizedQuestions.length > 0) {
      setError(`${sanitizedQuestions.length} de ${editingQuestions.length} perguntas foram adicionadas. Algumas estavam incompletas ou sem resposta correta.`);
    } else {
      setError(null);
    }

    onQuestionsGenerated(sanitizedQuestions);
    setGeneratedQuestions([]);
    setEditingQuestions([]);
    setTopic('');
    setGrade('');
  };

  const handleDiscard = () => {
    setGeneratedQuestions([]);
    setEditingQuestions([]);
    setError(null);
  };

  // Consider Tema (topic) and any available Disciplina only for enabling the generate button.
  // IMPORTANT:
  // - Even se disciplinaFromQuiz estiver temporariamente vazia, continuamos a permitir clique
  //   se houver Tema OU se existir um quizId (porque aí podemos tentar fallback via localStorage no handleGenerate).
  // - Isto garante que o utilizador consegue SEMPRE clicar em "Gerar perguntas" quando:
  //     * Tema preenchido, OU
  //     * Tema vazio mas há um quiz atual (quizId) para o qual podemos resolver Disciplina no momento do clique.
  const hasTopic = (topic || '').trim().length > 0;
  const hasDisciplinaProp = (disciplinaFromQuiz || '').trim().length > 0;
  const canAttemptFallback = !!quizId; // permite buscar Disciplina específica no localStorage para este quiz
  const isFormValid =
    (hasTopic || hasDisciplinaProp || canAttemptFallback) &&
    questionCount > 0 &&
    questionCount <= 10;

  const hasValidProvider = currentProvider === 'pollinations' ||
    (currentProvider === 'huggingface' && huggingFaceToken) ||
    (currentProvider === 'mistral' && mistralToken);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-all duration-300 transform hover:shadow-lg hover:-translate-y-1 relative">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gerar perguntas com IA</h2>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {providerStatus && (
            <div className={`text-sm px-2 py-1 rounded transition-colors duration-200 ${
              providerStatus.success
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              {providerStatus.message}
            </div>
          )}
        </div>
      </div>

      {generatedQuestions.length === 0 ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tema *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex.: História de Portugal, Funções quadráticas, Revolução Industrial..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>

          <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <input
              type="checkbox"
              id="generateImages"
              checked={generateImages}
              onChange={(e) => setGenerateImages(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="generateImages" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Gerar imagens automaticamente para cada pergunta
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nível/Ano
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              >
                {gradeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de pergunta
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <option value="mcq">Escolha múltipla</option>
                <option value="truefalse">Verdadeiro/Falso</option>
                <option value="short">Resposta curta</option>
                <option value="gapfill">Preencher lacuna</option>
                <option value="essay">Resposta discursiva</option>
                <option value="matching">Associação (colunas)</option>
                <option value="ordering">Sequência / Ordenação</option>
              </select>
              <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                A IA gera perguntas já estruturadas para este tipo. Depois podes ajustar manualmente antes de adicionar ao quiz.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número de perguntas: {questionCount}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md transition-colors duration-200">
              {error}
            </div>
          )}

          {!hasValidProvider && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400 px-4 py-3 rounded-md transition-colors duration-200">
              {currentProvider === 'huggingface'
                ? 'Configura o token do Hugging Face nas Definições para usar este provedor.'
              : currentProvider === 'mistral'
                ? 'Configura a chave de API do Mistral nas Definições para usar este provedor.'
                : 'Seleciona um provedor de IA nas Definições.'}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!isFormValid || !hasValidProvider || isGenerating}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] disabled:hover:scale-100 disabled:hover:shadow-md disabled:hover:translate-y-0"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                A gerar perguntas...
              </>
            ) : (
              'Gerar perguntas'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Perguntas geradas ({editingQuestions.length})</h3>
            <div className="space-x-2">
              <button
                onClick={handleDiscard}
                className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-md"
              >
                Descartar
              </button>
              <button
                onClick={handleAddToQuiz}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-300 hover:scale-105 hover:shadow-md"
              >
                Adicionar ao quiz
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {editingQuestions.map((question, qIndex) => (
              <div key={qIndex} className="border border-gray-200 dark:border-gray-600 rounded-md p-4 transition-all duration-300 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pergunta {qIndex + 1}
                  </label>
                  <textarea
                    value={question.prompt}
                    onChange={(e) => handleQuestionEdit(qIndex, 'prompt', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                    rows={2}
                  />
                </div>

                {question.type === 'mcq' && question.choices && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Opções
                    </label>
                    {question.choices.map((choice: any, cIndex: number) => (
                      <div key={cIndex} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={choice.correct}
                          onChange={() => {
                            const updatedQuestions = [...editingQuestions];
                            updatedQuestions[qIndex].choices = updatedQuestions[qIndex].choices.map((c: any, i: number) => ({
                              ...c,
                              correct: i === cIndex
                            }));
                            setEditingQuestions(updatedQuestions);
                          }}
                          className="h-4 w-4 text-blue-600"
                        />
                        <input
                          type="text"
                          value={choice.text}
                          onChange={(e) => handleChoiceEdit(qIndex, cIndex, 'text', e.target.value)}
                          className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {question.type === 'truefalse' && question.choices && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Resposta correta
                    </label>
                    <div className="flex space-x-4">
                      {question.choices.map((choice: any, cIndex: number) => (
                        <label key={cIndex} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`tf-correct-${qIndex}`}
                            checked={choice.correct}
                            onChange={() => {
                              const updatedQuestions = [...editingQuestions];
                              updatedQuestions[qIndex].choices = updatedQuestions[qIndex].choices.map((c: any, i: number) => ({
                                ...c,
                                correct: i === cIndex
                              }));
                              setEditingQuestions(updatedQuestions);
                            }}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="text-gray-900 dark:text-white">{choice.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {['short', 'gapfill', 'essay'].includes(question.type) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {question.type === 'gapfill'
                        ? 'Palavra/frase que completa a lacuna'
                        : question.type === 'essay'
                          ? 'Resposta modelo'
                          : 'Resposta correta'}
                    </label>
                    <textarea
                      value={extractAnswerText(question.answer)}
                      onChange={(e) => handleQuestionEdit(qIndex, 'answer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                      rows={2}
                      placeholder={question.type === 'essay' ? 'Resumo da resposta esperada...' : 'Resposta correta...'}
                    />
                  </div>
                )}

                {question.type === 'matching' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Pares de associação
                    </label>
                    <div className="space-y-2">
                      {question.matchingPairs?.map((pair: any, pIndex: number) => (
                        <div key={pIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={pair.leftItem || ''}
                            onChange={(e) => {
                              const updatedPairs = [...(question.matchingPairs || [])];
                              updatedPairs[pIndex] = { ...updatedPairs[pIndex], leftItem: e.target.value };
                              handleQuestionEdit(qIndex, 'matchingPairs', updatedPairs);
                            }}
                            className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                            placeholder="Item esquerdo"
                          />
                          <span>↔</span>
                          <input
                            type="text"
                            value={pair.rightItem || ''}
                            onChange={(e) => {
                              const updatedPairs = [...(question.matchingPairs || [])];
                              updatedPairs[pIndex] = { ...updatedPairs[pIndex], rightItem: e.target.value };
                              handleQuestionEdit(qIndex, 'matchingPairs', updatedPairs);
                            }}
                            className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                            placeholder="Item direito"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updatedPairs = question.matchingPairs?.filter((_: any, i: number) => i !== pIndex) || [];
                              handleQuestionEdit(qIndex, 'matchingPairs', updatedPairs);
                            }}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const updatedPairs = [...(question.matchingPairs || []), { leftItem: '', rightItem: '' }];
                          handleQuestionEdit(qIndex, 'matchingPairs', updatedPairs);
                        }}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
                      >
                        Adicionar par
                      </button>
                    </div>
                  </div>
                )}

                {question.type === 'ordering' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sequência correta
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Garanta pelo menos {MIN_ORDERING_ITEMS} passos e no máximo {MAX_ORDERING_ITEMS}.
                    </p>
                    <div className="space-y-2">
                      {question.orderingItems?.map((item: string, itemIndex: number) => (
                        <div key={`${qIndex}-ordering-${itemIndex}`} className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-6 text-center">
                            {itemIndex + 1}
                          </span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleOrderingItemChange(qIndex, itemIndex, e.target.value)}
                            className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                            placeholder="Descrição do passo"
                          />
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOrderingItemMove(qIndex, itemIndex, 'up')}
                              disabled={itemIndex === 0}
                              className={`px-2 py-1 rounded ${
                                itemIndex === 0
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOrderingItemMove(qIndex, itemIndex, 'down')}
                              disabled={itemIndex === (question.orderingItems?.length || 0) - 1}
                              className={`px-2 py-1 rounded ${
                                itemIndex === (question.orderingItems?.length || 0) - 1
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOrderingItemRemove(qIndex, itemIndex)}
                              disabled={(question.orderingItems?.length || 0) <= MIN_ORDERING_ITEMS}
                              className={`px-2 py-1 rounded ${
                                (question.orderingItems?.length || 0) <= MIN_ORDERING_ITEMS
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-500 text-white hover:bg-red-600'
                              }`}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleOrderingItemAdd(qIndex)}
                        disabled={(question.orderingItems?.length || 0) >= MAX_ORDERING_ITEMS}
                        className={`px-3 py-1 rounded ${
                          (question.orderingItems?.length || 0) >= MAX_ORDERING_ITEMS
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        Adicionar passo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiTextPanel;

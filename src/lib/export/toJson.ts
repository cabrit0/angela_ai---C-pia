import type { Quiz } from '../../types';

const SUPPORTED_QUESTION_TYPES: Quiz['questions'][number]['type'][] = [
  'mcq',
  'truefalse',
  'short',
  'gapfill',
  'essay',
  'matching',
  'ordering'
];

/**
 * Valida os dados de um quiz antes de exportar
 */
const validateQuiz = (quiz: Quiz): boolean => {
  if (!quiz || typeof quiz !== 'object') return false;
  
  // Verificar campos obrigatórios
  if (!quiz.id || typeof quiz.id !== 'string') return false;
  if (!quiz.title || typeof quiz.title !== 'string') return false;
  if (!Array.isArray(quiz.questions)) return false;
  
  // Verificar se cada pergunta tem os campos obrigatórios
  for (const question of quiz.questions) {
    if (!question.id || typeof question.id !== 'string') return false;
    if (!question.type || !SUPPORTED_QUESTION_TYPES.includes(question.type)) return false;
    if (!question.prompt || typeof question.prompt !== 'string' || question.prompt.trim() === '') return false;
    
    // Validações específicas por tipo
    if (question.type === 'mcq' || question.type === 'truefalse') {
      if (!Array.isArray(question.choices) || question.choices.length === 0) return false;
      
      // Verificar se há pelo menos uma resposta correta
      const hasCorrectChoice = question.choices.some(choice => choice.correct);
      if (!hasCorrectChoice) return false;
    }
    
    if (question.type === 'short' || question.type === 'gapfill' || question.type === 'essay') {
      if (typeof question.answer !== 'string' || question.answer.trim() === '') return false;
    }

    if (question.type === 'matching') {
      if (!Array.isArray(question.matchingPairs) || question.matchingPairs.length === 0) return false;

      const invalidPair = question.matchingPairs.some(pair =>
        !pair ||
        typeof pair.id !== 'string' ||
        typeof pair.leftItem !== 'string' ||
        typeof pair.rightItem !== 'string' ||
        pair.leftItem.trim() === '' ||
        pair.rightItem.trim() === ''
      );

      if (invalidPair) return false;
    }

    if (question.type === 'ordering') {
      if (!Array.isArray(question.orderingItems) || question.orderingItems.length < 3) return false;
      const hasEmptyOrder = question.orderingItems.some(item => !item || !item.trim());
      if (hasEmptyOrder) return false;
    }
  }
  
  return true;
};

/**
 * Converte um quiz para formato JSON com formatação adequada
 */
export const exportQuizToJson = (quiz: Quiz): string => {
  try {
    // Validar dados antes de exportar
    if (!validateQuiz(quiz)) {
      throw new Error('Dados do quiz inválidos para exportação');
    }
    
    // Preparar dados para exportação com metadados
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      quiz: {
        ...quiz,
        exported: true,
        exportedAt: Date.now()
      }
    };
    
    // Converter para JSON com indentação de 2 espaços
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Erro ao exportar quiz para JSON:', error);
    throw new Error('Falha ao exportar quiz para JSON: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};

/**
 * Exporta todos os quizzes para formato JSON
 */
export const exportAllQuizzesToJson = (quizzes: Quiz[]): string => {
  try {
    if (!Array.isArray(quizzes)) {
      throw new Error('Lista de quizzes inválida');
    }
    
    if (quizzes.length === 0) {
      throw new Error('Nenhum quiz para exportar');
    }
    
    // Validar cada quiz antes de exportar
    const validQuizzes = quizzes.filter(quiz => validateQuiz(quiz));
    
    if (validQuizzes.length === 0) {
      throw new Error('Nenhum quiz válido encontrado para exportação');
    }
    
    if (validQuizzes.length !== quizzes.length) {
      console.warn(`${quizzes.length - validQuizzes.length} quizzes inválidos foram ignorados na exportação`);
    }
    
    // Preparar dados para exportação com metadados
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      count: validQuizzes.length,
      quizzes: validQuizzes.map(quiz => ({
        ...quiz,
        exported: true,
        exportedAt: Date.now()
      }))
    };
    
    // Converter para JSON com indentação de 2 espaços
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Erro ao exportar todos os quizzes para JSON:', error);
    throw new Error('Falha ao exportar quizzes para JSON: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};

/**
 * Gera um nome de ficheiro para exportação de quiz individual
 */
export const generateQuizFilename = (quiz: Quiz): string => {
  const sanitizedTitle = quiz.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiais
    .replace(/\s+/g, '_') // Substituir espaços por underscores
    .substring(0, 50); // Limitar comprimento
  
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${sanitizedTitle}_${date}.quiz.json`;
};

/**
 * Gera um nome de ficheiro para exportação de múltiplos quizzes
 */
export const generateMultipleQuizzesFilename = (count: number): string => {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `quizzes_${count}_${date}.quiz.json`;
};

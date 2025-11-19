import type { Quiz, Question } from '../../types';
import { exportQuizzesAsJSON, importQuizzesFromJSON } from './storage';
import { exportQuizToJson, exportAllQuizzesToJson, generateQuizFilename, generateMultipleQuizzesFilename } from '../export/toJson';

const SUPPORTED_QUESTION_TYPES: Question['type'][] = [
  'mcq',
  'truefalse',
  'short',
  'gapfill',
  'essay',
  'matching',
  'ordering'
];

/**
 * Exporta um quiz como ficheiro .quiz.json
 */
export const exportQuizAsFile = (quiz: Quiz, filename?: string): void => {
  try {
    const jsonString = exportQuizzesAsJSON([quiz]);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Criar um link temporário para download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.quiz.json`;
    
    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar URL
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao exportar quiz como ficheiro:', error);
    throw new Error('Falha ao exportar quiz como ficheiro');
  }
};

/**
 * Exporta múltiplos quizzes como ficheiro .quiz.json
 */
export const exportQuizzesAsFile = (quizzes: Quiz[], filename?: string): void => {
  try {
    const jsonString = exportQuizzesAsJSON(quizzes);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Criar um link temporário para download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `quizzes_${new Date().toISOString().split('T')[0]}.quiz.json`;
    
    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar URL
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao exportar quizzes como ficheiro:', error);
    throw new Error('Falha ao exportar quizzes como ficheiro');
  }
};

/**
 * Importa quizzes de um ficheiro .quiz.json
 */
export const importQuizzesFromFile = (file: File): Promise<Quiz[]> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Nenhum ficheiro selecionado'));
      return;
    }
    
    // Verificar se o ficheiro tem a extensão correta
    if (!file.name.endsWith('.quiz.json') && !file.name.endsWith('.json')) {
      reject(new Error('O ficheiro deve ter a extensão .quiz.json ou .json'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const quizzes = importQuizzesFromJSON(jsonString);
        resolve(quizzes);
      } catch (error) {
        console.error('Erro ao processar ficheiro:', error);
        reject(error instanceof Error ? error : new Error('Erro ao processar ficheiro'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o ficheiro'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Valida um ficheiro de quiz antes de importar
 */
export const validateQuizFile = (file: File): Promise<{ valid: boolean; error?: string; quizzes?: Quiz[] }> => {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ valid: false, error: 'Nenhum ficheiro selecionado' });
      return;
    }
    
    // Verificar se o ficheiro tem a extensão correta
    if (!file.name.endsWith('.quiz.json') && !file.name.endsWith('.json')) {
      resolve({ valid: false, error: 'O ficheiro deve ter a extensão .quiz.json ou .json' });
      return;
    }
    
    // Verificar tamanho do ficheiro (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      resolve({ valid: false, error: 'O ficheiro é muito grande (máximo 10MB)' });
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const quizzes = importQuizzesFromJSON(jsonString);
        
        if (quizzes.length === 0) {
          resolve({ valid: false, error: 'Nenhum quiz válido encontrado no ficheiro' });
          return;
        }
        
        resolve({ valid: true, quizzes });
      } catch (error) {
        console.error('Erro ao validar ficheiro:', error);
        resolve({ 
          valid: false, 
          error: error instanceof Error ? error.message : 'Erro ao validar ficheiro' 
        });
      }
    };
    
    reader.onerror = () => {
      resolve({ valid: false, error: 'Erro ao ler o ficheiro' });
    };
    
    reader.readAsText(file);
  });
};

/**
 * Cria um input de ficheiro para importar quizzes
 */
export const createFileInputForImport = (
  onImport: (quizzes: Quiz[]) => void,
  onError?: (error: string) => void
): HTMLInputElement => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.quiz.json,.json';
  
  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const quizzes = await importQuizzesFromFile(file);
      onImport(quizzes);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao importar ficheiro';
      console.error('Erro ao importar quizzes:', error);
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
    }
    
    // Limpar o input para permitir selecionar o mesmo ficheiro novamente
    input.value = '';
  };
  
  return input;
};

/**
 * Função para importar quizzes usando um diálogo de ficheiro
 */
export const importQuizzesFromDialog = (): Promise<Quiz[]> => {
  return new Promise((resolve, reject) => {
    const input = createFileInputForImport(
      (quizzes) => resolve(quizzes),
      (error) => reject(new Error(error))
    );
    
    input.click();
  });
};

/**
 * Verifica se um quiz já existe na lista de quizzes (baseado no ID ou título)
 */
export const findDuplicateQuiz = (quiz: Quiz, existingQuizzes: Quiz[]): Quiz | null => {
  // Primeiro, verificar por ID
  const byId = existingQuizzes.find(q => q.id === quiz.id);
  if (byId) return byId;
  
  // Depois, verificar por título (case insensitive)
  const byTitle = existingQuizzes.find(q => 
    q.title.toLowerCase().trim() === quiz.title.toLowerCase().trim()
  );
  
  return byTitle || null;
};

/**
 * Prepara quizzes para importação, removendo duplicados ou gerando novos IDs
 */
export const prepareQuizzesForImport = (
  newQuizzes: Quiz[], 
  existingQuizzes: Quiz[], 
  options: {
    removeDuplicates?: boolean;
    generateNewIds?: boolean;
  } = {}
): Quiz[] => {
  const { removeDuplicates = true, generateNewIds = false } = options;
  
  return newQuizzes.map(quiz => {
    const duplicate = findDuplicateQuiz(quiz, existingQuizzes);
    
    // Se for duplicado e devemos remover, retornar null
    if (duplicate && removeDuplicates) {
      return null;
    }
    
    // Se devemos gerar novos IDs ou se for duplicado que vamos manter
    if (generateNewIds || (duplicate && !removeDuplicates)) {
      return {
        ...quiz,
        id: Math.random().toString(36).substring(2, 15),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }
    
    return quiz;
  }).filter(Boolean) as Quiz[];
};

/**
 * Faz o download de um ficheiro JSON com os dados fornecidos
 */
export const downloadJsonFile = (data: string, filename: string): void => {
  try {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Criar um link temporário para download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar URL
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao fazer download do ficheiro JSON:', error);
    throw new Error('Falha ao fazer download do ficheiro JSON');
  }
};

/**
 * Exporta um quiz individual para JSON e faz o download
 */
export const exportQuizToJsonAndDownload = (quiz: Quiz): void => {
  try {
    const jsonData = exportQuizToJson(quiz);
    const filename = generateQuizFilename(quiz);
    downloadJsonFile(jsonData, filename);
  } catch (error) {
    console.error('Erro ao exportar quiz para JSON:', error);
    throw error;
  }
};

/**
 * Exporta todos os quizzes para JSON e faz o download
 */
export const exportAllQuizzesToJsonAndDownload = (quizzes: Quiz[]): void => {
  try {
    const jsonData = exportAllQuizzesToJson(quizzes);
    const filename = generateMultipleQuizzesFilename(quizzes.length);
    downloadJsonFile(jsonData, filename);
  } catch (error) {
    console.error('Erro ao exportar todos os quizzes para JSON:', error);
    throw error;
  }
};

/**
 * Importa um quiz de um ficheiro .quiz.json com validação detalhada
 */
export const importQuizFromFile = async (file: File): Promise<Quiz> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Nenhum ficheiro selecionado'));
      return;
    }
    
    // Verificar se o ficheiro tem a extensão correta
    if (!file.name.endsWith('.quiz.json') && !file.name.endsWith('.json')) {
      reject(new Error('O ficheiro deve ter a extensão .quiz.json ou .json'));
      return;
    }
    
    // Verificar tamanho do ficheiro (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      reject(new Error('O ficheiro é muito grande (máximo 10MB)'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const importData = JSON.parse(jsonString);
        
        // Verificar se é o formato novo (com metadados) ou antigo (diretamente o quiz)
        let quiz: Quiz;
        
        if (importData.quiz && typeof importData.quiz === 'object') {
          // Formato novo - com metadados
          quiz = importData.quiz;
        } else if (importData.id && importData.title && importData.questions) {
          // Formato antigo - diretamente o quiz
          quiz = importData;
        } else {
          throw new Error('Formato de ficheiro inválido: não foi possível encontrar dados do quiz');
        }
        
        // Validar estrutura do quiz importado
        if (!quiz.id || typeof quiz.id !== 'string') {
          throw new Error('ID do quiz inválido ou ausente');
        }
        
        if (!quiz.title || typeof quiz.title !== 'string') {
          throw new Error('Título do quiz inválido ou ausente');
        }
        
        if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
          throw new Error('O quiz deve ter pelo menos uma pergunta');
        }
        
        // Validar cada pergunta
        for (let i = 0; i < quiz.questions.length; i++) {
          const question = quiz.questions[i];
          
          if (!question.id || typeof question.id !== 'string') {
            throw new Error(`ID da pergunta ${i + 1} inválido ou ausente`);
          }
          
          if (!question.type || !SUPPORTED_QUESTION_TYPES.includes(question.type)) {
            throw new Error(`Tipo da pergunta ${i + 1} inválido`);
          }
          
          if (!question.prompt || typeof question.prompt !== 'string' || question.prompt.trim() === '') {
            throw new Error(`Enunciado da pergunta ${i + 1} inválido ou ausente`);
          }
          
          // Validações específicas por tipo
          if (question.type === 'mcq' || question.type === 'truefalse') {
            if (!Array.isArray(question.choices) || question.choices.length === 0) {
              throw new Error(`A pergunta ${i + 1} deve ter opções de resposta`);
            }
            
            const hasCorrectChoice = question.choices.some(choice => choice.correct);
            if (!hasCorrectChoice) {
              throw new Error(`A pergunta ${i + 1} deve ter pelo menos uma resposta correta`);
            }
          }
          
          if (question.type === 'short' || question.type === 'gapfill' || question.type === 'essay') {
            if (typeof question.answer !== 'string' || question.answer.trim() === '') {
              throw new Error(`A pergunta ${i + 1} deve ter uma resposta definida`);
            }
          }

          if (question.type === 'matching') {
            if (!Array.isArray(question.matchingPairs) || question.matchingPairs.length === 0) {
              throw new Error(`A pergunta ${i + 1} deve ter pares de correspondencia`);
            }

            const invalidPair = question.matchingPairs.some(pair =>
              !pair ||
              typeof pair.id !== 'string' ||
              typeof pair.leftItem !== 'string' ||
              typeof pair.rightItem !== 'string' ||
              pair.leftItem.trim() === '' ||
              pair.rightItem.trim() === ''
            );

            if (invalidPair) {
              throw new Error(`A pergunta ${i + 1} tem pares de correspondencia invalidos`);
            }
          }

          if (question.type === 'ordering') {
            if (!Array.isArray(question.orderingItems) || question.orderingItems.length < 3) {
              throw new Error(`A pergunta ${i + 1} de ordenação deve ter pelo menos 3 passos.`);
            }
            const hasEmptyStep = question.orderingItems.some(item => !item || !item.trim());
            if (hasEmptyStep) {
              throw new Error(`A pergunta ${i + 1} tem passos de ordenação vazios.`);
            }
          }
        }
        
        // Remover campos de exportação se existirem
        const { exported, exportedAt, ...cleanQuiz } = quiz as any;
        
        resolve(cleanQuiz);
      } catch (error) {
        console.error('Erro ao processar ficheiro:', error);
        if (error instanceof SyntaxError) {
          reject(new Error('Ficheiro JSON mal formatado'));
        } else if (error instanceof Error) {
          reject(error);
        } else {
          reject(new Error('Erro ao processar ficheiro'));
        }
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o ficheiro'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Importa múltiplos quizzes de um ficheiro .quiz.json
 */
export const importMultipleQuizzesFromFile = async (file: File): Promise<Quiz[]> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Nenhum ficheiro selecionado'));
      return;
    }
    
    // Verificar se o ficheiro tem a extensão correta
    if (!file.name.endsWith('.quiz.json') && !file.name.endsWith('.json')) {
      reject(new Error('O ficheiro deve ter a extensão .quiz.json ou .json'));
      return;
    }
    
    // Verificar tamanho do ficheiro (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      reject(new Error('O ficheiro é muito grande (máximo 10MB)'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const importData = JSON.parse(jsonString);
        
        let quizzes: Quiz[] = [];
        
        // Verificar se é o formato novo (com metadados) ou antigo (array direto)
        if (importData.quizzes && Array.isArray(importData.quizzes)) {
          // Formato novo - com metadados
          quizzes = importData.quizzes;
        } else if (Array.isArray(importData)) {
          // Formato antigo - diretamente um array
          quizzes = importData;
        } else {
          throw new Error('Formato de ficheiro inválido: não foi possível encontrar dados dos quizzes');
        }
        
        if (quizzes.length === 0) {
          throw new Error('Nenhum quiz encontrado no ficheiro');
        }
        
        // Validar cada quiz
        const validQuizzes: Quiz[] = [];
        
        for (let i = 0; i < quizzes.length; i++) {
          const quiz = quizzes[i];
          
          try {
            // Validar estrutura do quiz
            if (!quiz.id || typeof quiz.id !== 'string') {
              throw new Error(`ID do quiz ${i + 1} inválido ou ausente`);
            }
            
            if (!quiz.title || typeof quiz.title !== 'string') {
              throw new Error(`Título do quiz ${i + 1} inválido ou ausente`);
            }
            
            if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
              throw new Error(`O quiz ${i + 1} deve ter pelo menos uma pergunta`);
            }
            
            // Validar cada pergunta
            for (let j = 0; j < quiz.questions.length; j++) {
              const question = quiz.questions[j];
              
              if (!question.id || typeof question.id !== 'string') {
                throw new Error(`ID da pergunta ${j + 1} do quiz ${i + 1} inválido ou ausente`);
              }
              
              if (!question.type || !SUPPORTED_QUESTION_TYPES.includes(question.type)) {
                throw new Error(`Tipo da pergunta ${j + 1} do quiz ${i + 1} inválido`);
              }
              
              if (!question.prompt || typeof question.prompt !== 'string' || question.prompt.trim() === '') {
                throw new Error(`Enunciado da pergunta ${j + 1} do quiz ${i + 1} inválido ou ausente`);
              }
              
              // Validações específicas por tipo
              if (question.type === 'mcq' || question.type === 'truefalse') {
                if (!Array.isArray(question.choices) || question.choices.length === 0) {
                  throw new Error(`A pergunta ${j + 1} do quiz ${i + 1} deve ter opções de resposta`);
                }
                
                const hasCorrectChoice = question.choices.some(choice => choice.correct);
                if (!hasCorrectChoice) {
                  throw new Error(`A pergunta ${j + 1} do quiz ${i + 1} deve ter pelo menos uma resposta correta`);
                }
              }
              
              if (question.type === 'short' || question.type === 'gapfill' || question.type === 'essay') {
                if (typeof question.answer !== 'string' || question.answer.trim() === '') {
                  throw new Error(`A pergunta ${j + 1} do quiz ${i + 1} deve ter uma resposta definida`);
                }
              }

              if (question.type === 'matching') {
                if (!Array.isArray(question.matchingPairs) || question.matchingPairs.length === 0) {
                  throw new Error(`A pergunta ${j + 1} do quiz ${i + 1} deve ter pares de correspondencia`);
                }

                const invalidPair = question.matchingPairs.some(pair =>
                  !pair ||
                  typeof pair.id !== 'string' ||
                  typeof pair.leftItem !== 'string' ||
                  typeof pair.rightItem !== 'string' ||
                  pair.leftItem.trim() === '' ||
                  pair.rightItem.trim() === ''
                );

              if (invalidPair) {
                throw new Error(`A pergunta ${j + 1} do quiz ${i + 1} tem pares de correspondencia invalidos`);
              }
            }

              if (question.type === 'ordering') {
                if (!Array.isArray(question.orderingItems) || question.orderingItems.length < 3) {
                  throw new Error(`A pergunta ${j + 1} do quiz ${i + 1} de ordenação deve ter pelo menos 3 passos.`);
                }
                const hasEmptyStep = question.orderingItems.some(item => !item || !item.trim());
                if (hasEmptyStep) {
                  throw new Error(`A pergunta ${j + 1} do quiz ${i + 1} tem passos de ordenação vazios.`);
                }
              }
            }
            
            // Remover campos de exportação se existirem
            const { exported, exportedAt, ...cleanQuiz } = quiz as any;
            validQuizzes.push(cleanQuiz);
          } catch (error) {
            console.warn(`Quiz ${i + 1} inválido e será ignorado:`, error);
          }
        }
        
        if (validQuizzes.length === 0) {
          throw new Error('Nenhum quiz válido encontrado no ficheiro');
        }
        
        resolve(validQuizzes);
      } catch (error) {
        console.error('Erro ao processar ficheiro:', error);
        if (error instanceof SyntaxError) {
          reject(new Error('Ficheiro JSON mal formatado'));
        } else if (error instanceof Error) {
          reject(error);
        } else {
          reject(new Error('Erro ao processar ficheiro'));
        }
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o ficheiro'));
    };
    
    reader.readAsText(file);
  });
};

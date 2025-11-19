import type { AppSettings, ApiTestResult, StorageKeys } from '../../types/settings';
import type { Quiz } from '../../types';

// Chaves para o localStorage
const KEYS: StorageKeys = {
  SETTINGS: 'quiz-app-settings',
  API_TESTS: 'quiz-app-api-tests',
  QUIZZES: 'quiz-app-quizzes'
};

// Definições por defeito
const DEFAULT_SETTINGS: AppSettings = {
  textProvider: 'pollinations',
  imageProvider: 'pollinations',
  updatedAt: Date.now()
};

/**
 * Guarda as definições da aplicação no localStorage
 */
export const saveSettings = (settings: AppSettings): void => {
  try {
    const updatedSettings = {
      ...settings,
      updatedAt: Date.now()
    };
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Erro ao guardar definições:', error);
  }
};

/**
 * Carrega as definições da aplicação do localStorage
 */
export const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(KEYS.SETTINGS);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Erro ao carregar definições:', error);
  }
  return DEFAULT_SETTINGS;
};

/**
 * Guarda o token do Hugging Face de forma segura
 */
export const saveHuggingFaceToken = (token: string): void => {
  try {
    const settings = loadSettings();
    settings.huggingFaceToken = token;
    saveSettings(settings);
  } catch (error) {
    console.error('Erro ao guardar token:', error);
  }
};

/**
 * Obtém o token do Hugging Face
 */
export const getHuggingFaceToken = (): string | undefined => {
  try {
    const settings = loadSettings();
    return settings.huggingFaceToken;
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return undefined;
  }
};

/**
 * Remove o token do Hugging Face
 */
export const removeHuggingFaceToken = (): void => {
  try {
    const settings = loadSettings();
    delete settings.huggingFaceToken;
    saveSettings(settings);
  } catch (error) {
    console.error('Erro ao remover token:', error);
  }
};

/**
 * Guarda o token do Mistral de forma segura
 */
export const saveMistralToken = (token: string): void => {
  try {
    const settings = loadSettings();
    settings.mistralToken = token;
    saveSettings(settings);
  } catch (error) {
    console.error('Erro ao guardar token:', error);
  }
};

/**
 * Obtém o token do Mistral
 */
export const getMistralToken = (): string | undefined => {
  try {
    const settings = loadSettings();
    return settings.mistralToken;
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return undefined;
  }
};

/**
 * Remove o token do Mistral
 */
export const removeMistralToken = (): void => {
  try {
    const settings = loadSettings();
    delete settings.mistralToken;
    saveSettings(settings);
  } catch (error) {
    console.error('Erro ao remover token:', error);
  }
};

/**
 * Guarda resultados de testes de API
 */
export const saveApiTestResult = (result: ApiTestResult): void => {
  try {
    const existing = localStorage.getItem(KEYS.API_TESTS);
    const tests: ApiTestResult[] = existing ? JSON.parse(existing) : [];
    
    // Adicionar novo resultado e manter apenas os últimos 10
    tests.unshift(result);
    const recentTests = tests.slice(0, 10);
    
    localStorage.setItem(KEYS.API_TESTS, JSON.stringify(recentTests));
  } catch (error) {
    console.error('Erro ao guardar resultado do teste:', error);
  }
};

/**
 * Obtém resultados de testes de API recentes
 */
export const getApiTestResults = (): ApiTestResult[] => {
  try {
    const stored = localStorage.getItem(KEYS.API_TESTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erro ao carregar resultados dos testes:', error);
    return [];
  }
};

/**
 * Limpa todos os dados da aplicação do localStorage
 */
export const clearAllData = (): void => {
  try {
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.API_TESTS);
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
  }
};

/**
 * Testa a conectividade com a API do Pollinations
 */
export const testPollinationsConnectivity = async (type: 'text' | 'image'): Promise<ApiTestResult> => {
  const startTime = Date.now();
  
  try {
    if (type === 'text') {
      // Teste simples para a API de texto
      const response = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 1
        })
      });
      
      if (response.ok) {
        return {
          provider: 'pollinations',
          type: 'text',
          success: true,
          message: 'Conectividade estabelecida com sucesso',
          timestamp: startTime
        };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } else {
      // Teste simples para a API de imagens
      const response = await fetch('https://image.pollinations.ai/prompt/test', {
        method: 'GET'
      });
      
      if (response.ok) {
        return {
          provider: 'pollinations',
          type: 'image',
          success: true,
          message: 'Conectividade estabelecida com sucesso',
          timestamp: startTime
        };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    }
  } catch (error) {
    return {
      provider: 'pollinations',
      type,
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: startTime
    };
  }
};

/**
 * Testa a conectividade com a API do Hugging Face
 */
export const testHuggingFaceConnectivity = async (token: string, type: 'text' | 'image'): Promise<ApiTestResult> => {
  const startTime = Date.now();
  
  if (!token) {
    return {
      provider: 'huggingface',
      type,
      success: false,
      message: 'Token não fornecido',
      timestamp: startTime
    };
  }
  
  try {
    if (type === 'text') {
      // Teste simples para a API de texto
      const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: 'Test',
          parameters: {
            max_new_tokens: 1
          }
        })
      });
      
      if (response.ok) {
        return {
          provider: 'huggingface',
          type: 'text',
          success: true,
          message: 'Conectividade estabelecida com sucesso',
          timestamp: startTime
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } else {
      // Teste simples para a API de imagens
      const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: 'Test'
        })
      });
      
      if (response.ok) {
        return {
          provider: 'huggingface',
          type: 'image',
          success: true,
          message: 'Conectividade estabelecida com sucesso',
          timestamp: startTime
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    }
  } catch (error) {
    return {
      provider: 'huggingface',
      type,
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: startTime
    };
  }
};

/**
 * Testa a conectividade com a API do Mistral
 */
export const testMistralConnectivity = async (token: string, type: 'text' | 'image'): Promise<ApiTestResult> => {
  const startTime = Date.now();
  
  if (!token) {
    return {
      provider: 'mistral',
      type,
      success: false,
      message: 'Token não fornecido',
      timestamp: startTime
    };
  }
  
  try {
    if (type === 'text') {
      // Teste simples para a API de texto
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 1
        })
      });
      
      if (response.ok) {
        return {
          provider: 'mistral',
          type: 'text',
          success: true,
          message: 'Conectividade estabelecida com sucesso',
          timestamp: startTime
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } else {
      // Mistral não suporta geração de imagens diretamente
      return {
        provider: 'mistral',
        type: 'image',
        success: false,
        message: 'Mistral não suporta geração de imagens',
        timestamp: startTime
      };
    }
  } catch (error) {
    return {
      provider: 'mistral',
      type,
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: startTime
    };
  }
};

/**
 * Guarda quizzes no localStorage
 */
export const saveQuizzes = (quizzes: Quiz[]): boolean => {
  console.log('=== STORAGE: saveQuizzes called ===');
  console.log('Number of quizzes to save:', quizzes.length);
  
  try {
    const quizzesJson = JSON.stringify(quizzes);
    console.log('JSON size:', quizzesJson.length, 'characters');
    
    localStorage.setItem(KEYS.QUIZZES, quizzesJson);
    console.log('Successfully saved to localStorage');
    
    // Verify it was saved correctly
    const saved = localStorage.getItem(KEYS.QUIZZES);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('Verification: saved', parsed.length, 'quizzes');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao guardar quizzes:', error);
    
    // Tentar limpar espaço se o localStorage estiver cheio
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.log('LocalStorage quota exceeded, trying to clean up...');
      try {
        const quizzesCount = quizzes.length;
        if (quizzesCount > 1) {
          // Manter apenas metade dos quizzes mais recentes
          const recentQuizzes = quizzes
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, Math.ceil(quizzesCount / 2));
          
          localStorage.setItem(KEYS.QUIZZES, JSON.stringify(recentQuizzes));
          console.warn('LocalStorage cheio. Apenas os quizzes mais recentes foram guardados.');
          return true;
        }
      } catch (cleanupError) {
        console.error('Erro ao limpar espaço no localStorage:', cleanupError);
      }
    }
    
    return false;
  }
};

/**
 * Carrega quizzes do localStorage
 */
export const loadQuizzes = (): Quiz[] => {
  console.log('=== STORAGE: loadQuizzes called ===');
  
  try {
    const stored = localStorage.getItem(KEYS.QUIZZES);
    console.log('Stored data found:', !!stored);
    
    if (stored) {
      console.log('Stored data size:', stored.length, 'characters');
      const quizzes = JSON.parse(stored);
      console.log('Parsed quizzes:', quizzes.length, 'items');
      
      // Validar estrutura dos dados
      if (Array.isArray(quizzes)) {
        const validQuizzes = quizzes.filter(quiz =>
          quiz &&
          typeof quiz.id === 'string' &&
          typeof quiz.title === 'string' &&
          Array.isArray(quiz.questions)
        );
        console.log('Valid quizzes:', validQuizzes.length, 'of', quizzes.length);
        return validQuizzes;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar quizzes:', error);
    
    // Tentar recuperar dados corrompidos
    try {
      localStorage.removeItem(KEYS.QUIZZES);
      console.warn('Dados corrompidos removidos do localStorage.');
    } catch (cleanupError) {
      console.error('Erro ao limpar dados corrompidos:', cleanupError);
    }
  }
  
  console.log('Returning empty array');
  return [];
};

/**
 * Exporta quizzes como JSON
 */
export const exportQuizzesAsJSON = (quizzes: Quiz[]): string => {
  try {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      quizzes: quizzes
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Erro ao exportar quizzes:', error);
    throw new Error('Falha ao exportar quizzes');
  }
};

/**
 * Importa quizzes de JSON
 */
export const importQuizzesFromJSON = (jsonString: string): Quiz[] => {
  try {
    const importData = JSON.parse(jsonString);
    
    // Validar estrutura dos dados
    if (!importData || typeof importData !== 'object') {
      throw new Error('Formato de ficheiro inválido');
    }
    
    let quizzes: Quiz[] = [];
    
    // Verificar se é o formato novo (com metadados) ou antigo (apenas array)
    if (Array.isArray(importData)) {
      // Formato antigo - diretamente um array de quizzes
      quizzes = importData;
    } else if (importData.quizzes && Array.isArray(importData.quizzes)) {
      // Formato novo - com metadados
      quizzes = importData.quizzes;
    } else {
      throw new Error('Nenhum quiz encontrado no ficheiro');
    }
    
    // Validar cada quiz
    const validQuizzes = quizzes.filter(quiz =>
      quiz &&
      typeof quiz.id === 'string' &&
      typeof quiz.title === 'string' &&
      Array.isArray(quiz.questions)
    );
    
    if (validQuizzes.length !== quizzes.length) {
      console.warn(`${quizzes.length - validQuizzes.length} quizzes inválidos foram ignorados`);
    }
    
    return validQuizzes;
  } catch (error) {
    console.error('Erro ao importar quizzes:', error);
    throw new Error('Falha ao importar quizzes: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};

/**
 * Auto-salva quizzes com debounce
 */
export const createAutoSave = (callback: (quizzes: Quiz[]) => void, delay: number = 1000) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (quizzes: Quiz[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      callback(quizzes);
      timeoutId = null;
    }, delay);
  };
};

/**
 * Verifica se o localStorage está disponível
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Verifica se o sessionStorage está disponível (fallback)
 */
export const isSessionStorageAvailable = (): boolean => {
  try {
    const test = '__test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Obtém o storage disponível (localStorage ou sessionStorage)
 */
export const getAvailableStorage = (): Storage | null => {
  if (isLocalStorageAvailable()) {
    return localStorage;
  }
  
  if (isSessionStorageAvailable()) {
    console.warn('LocalStorage indisponível. Usando sessionStorage como fallback.');
    return sessionStorage;
  }
  
  console.warn('Nenhum storage disponível. Os dados não serão persistidos.');
  return null;
};
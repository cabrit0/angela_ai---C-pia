// Tipos para as definições da aplicação

export type AiProvider = 'pollinations' | 'huggingface' | 'mistral';

export interface AppSettings {
  // Fornecedor de IA para texto
  textProvider: AiProvider;
  
  // Fornecedor de IA para imagens
  imageProvider: AiProvider;
  
  // Token do Hugging Face (opcional)
  huggingFaceToken?: string;
  
  // Token do Mistral (opcional)
  mistralToken?: string;
  
  // Data da última atualização
  updatedAt: number;
}

export interface ApiTestResult {
  provider: AiProvider;
  type: 'text' | 'image';
  success: boolean;
  message: string;
  timestamp: number;
}

export interface StorageKeys {
  SETTINGS: 'quiz-app-settings';
  API_TESTS: 'quiz-app-api-tests';
  QUIZZES: 'quiz-app-quizzes';
}
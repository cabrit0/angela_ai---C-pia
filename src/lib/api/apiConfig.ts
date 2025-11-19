import type { AiProvider } from '../../types';

// Configurações detalhadas para cada API
export interface ApiProviderConfig {
  name: string;
  description: string;
  requiresToken: boolean;
  isFree: boolean;
  endpoints: {
    text: string;
    image?: string;
  };
  models: {
    text: {
      primary: string;
      fallback?: string;
      recommended: string[];
    };
    image?: {
      primary: string;
      fallback?: string;
      recommended: string[];
    };
  };
  limits: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    tokensPerRequest?: number;
    maxQuestionsPerRequest?: number;
  };
  features: {
    multipleLanguages: boolean;
    customInstructions: boolean;
    temperatureControl: boolean;
    seedControl: boolean;
  };
  documentation: {
    tokenUrl?: string;
    signupUrl?: string;
    docsUrl?: string;
    pricingUrl?: string;
  };
  errorMessages: {
    invalidToken: string;
    rateLimit: string;
    modelUnavailable: string;
    generalError: string;
  };
}

// Configuração para Pollinations
export const pollinationsConfig: ApiProviderConfig = {
  name: 'Pollinations',
  description: 'Serviço gratuito de IA sem necessidade de registro ou chave de API. Ideal para testes e uso casual.',
  requiresToken: false,
  isFree: true,
  endpoints: {
    text: 'https://text.pollinations.ai/openai',
    image: 'https://image.pollinations.ai/prompt'
  },
  models: {
    text: {
      primary: 'openai',
      recommended: ['openai']
    },
    image: {
      primary: 'default',
      recommended: ['default']
    }
  },
  limits: {
    requestsPerMinute: 60, // Aproximado, pode variar
    maxQuestionsPerRequest: 10, // Recomendado para melhor qualidade
    tokensPerRequest: 2000
  },
  features: {
    multipleLanguages: true,
    customInstructions: true,
    temperatureControl: false, // Pollinations não suporta controle de temperatura
    seedControl: true
  },
  documentation: {
    docsUrl: 'https://pollinations.ai',
    signupUrl: 'https://pollinations.ai'
  },
  errorMessages: {
    invalidToken: 'Pollinations não requer token, mas ocorreu um erro de autenticação.',
    rateLimit: 'Limite de taxa do Pollinations excedido. Tente novamente em alguns minutos.',
    modelUnavailable: 'Modelo Pollinations temporariamente indisponível. Tente novamente.',
    generalError: 'Erro ao comunicar com Pollinations. Tente novamente ou use Hugging Face.'
  }
};

// Configuração para Hugging Face
export const huggingFaceConfig: ApiProviderConfig = {
  name: 'Hugging Face',
  description: 'Plataforma de IA com modelos avançados e gratuitos. Requer token gratuito para acesso.',
  requiresToken: true,
  isFree: true, // Tier gratuito disponível
  endpoints: {
    text: 'https://api-inference.huggingface.co/models',
    image: 'https://api-inference.huggingface.co/models'
  },
  models: {
    text: {
      primary: 'mistralai/Mistral-7B-Instruct-v0.1',
      fallback: 'TinyLlama/TinyLlama-1.1B-Chat-v1.0',
      recommended: [
        'mistralai/Mistral-7B-Instruct-v0.1',
        'TinyLlama/TinyLlama-1.1B-Chat-v1.0',
        'microsoft/DialoGPT-medium',
        'facebook/blenderbot-400M-distill'
      ]
    },
    image: {
      primary: 'stabilityai/stable-diffusion-2-1',
      fallback: 'runwayml/stable-diffusion-v1-5',
      recommended: [
        'stabilityai/stable-diffusion-2-1',
        'runwayml/stable-diffusion-v1-5',
        'CompVis/stable-diffusion-v1-4'
      ]
    }
  },
  limits: {
    requestsPerMinute: 30, // Para usuários gratuitos
    requestsPerHour: 300,
    tokensPerRequest: 2000,
    maxQuestionsPerRequest: 8 // Recomendado para modelos gratuitos
  },
  features: {
    multipleLanguages: true,
    customInstructions: true,
    temperatureControl: true,
    seedControl: false
  },
  documentation: {
    tokenUrl: 'https://huggingface.co/settings/tokens',
    signupUrl: 'https://huggingface.co/join',
    docsUrl: 'https://huggingface.co/docs/api-inference/index',
    pricingUrl: 'https://huggingface.co/pricing'
  },
  errorMessages: {
    invalidToken: 'Token Hugging Face inválido ou expirado. Verifique em huggingface.co/settings/tokens',
    rateLimit: 'Limite de taxa do Hugging Face excedido. Tente novamente em alguns minutos.',
    modelUnavailable: 'Modelo Hugging Face está carregando. Tente novamente em instantes.',
    generalError: 'Erro ao comunicar com Hugging Face. Verifique seu token e conexão.'
  }
};

// Configuração para Mistral
export const mistralConfig: ApiProviderConfig = {
  name: 'Mistral',
  description: 'API direta do Mistral com modelos avançados de IA. Requer chave de API.',
  requiresToken: true,
  isFree: false, // Mistral tem plano pago mas com crédito gratuito inicial
  endpoints: {
    text: 'https://api.mistral.ai/v1/chat/completions'
  },
  models: {
    text: {
      primary: 'mistral-large-2411',
      fallback: 'mistral-small-2411',
      recommended: [
        'mistral-large-2411',
        'mistral-small-2411',
        'codestral-2411'
      ]
    }
  },
  limits: {
    requestsPerMinute: 60, // Pode variar conforme o plano
    requestsPerHour: 1000,
    tokensPerRequest: 4000,
    maxQuestionsPerRequest: 15 // Pode lidar com mais perguntas devido à melhor qualidade
  },
  features: {
    multipleLanguages: true,
    customInstructions: true,
    temperatureControl: true,
    seedControl: false
  },
  documentation: {
    tokenUrl: 'https://console.mistral.ai/api-keys',
    signupUrl: 'https://console.mistral.ai/',
    docsUrl: 'https://docs.mistral.ai/',
    pricingUrl: 'https://mistral.ai/pricing'
  },
  errorMessages: {
    invalidToken: 'Token do Mistral inválido ou expirado. Verifique em console.mistral.ai/api-keys',
    rateLimit: 'Limite de taxa do Mistral excedido. Tente novamente em alguns minutos.',
    modelUnavailable: 'Modelo Mistral temporariamente indisponível. Tente novamente.',
    generalError: 'Erro ao comunicar com Mistral. Verifique seu token e conexão.'
  }
};

// Função para obter configuração do provedor
export function getProviderConfig(provider: AiProvider): ApiProviderConfig {
  switch (provider) {
    case 'pollinations':
      return pollinationsConfig;
    case 'huggingface':
      return huggingFaceConfig;
    case 'mistral':
      return mistralConfig;
    default:
      throw new Error(`Provedor não reconhecido: ${provider}`);
  }
}

// Função para obter URL do modelo
export function getModelUrl(provider: AiProvider, model: string, type: 'text' | 'image'): string {
  const config = getProviderConfig(provider);
  
  if (provider === 'huggingface') {
    return `${config.endpoints[type]}/${model}`;
  }
  
  if (provider === 'mistral') {
    return config.endpoints[type] || '';
  }
  
  return config.endpoints[type] || '';
}

// Função para validar token
export function validateToken(provider: AiProvider, token?: string): { valid: boolean; message: string } {
  const config = getProviderConfig(provider);
  
  if (!config.requiresToken) {
    return { valid: true, message: 'Token não necessário para este provedor' };
  }
  
  if (!token) {
    return { valid: false, message: 'Token é necessário para este provedor' };
  }
  
  if (token.length < 10) {
    return { valid: false, message: 'Token muito curto. Verifique se copiou corretamente.' };
  }
  
  if (provider === 'huggingface' && !token.startsWith('hf_')) {
    return { valid: false, message: 'Token Hugging Face deve começar com "hf_"' };
  }
  
  if (provider === 'mistral' && !token.match(/^[a-zA-Z0-9_-]{20,}$/)) {
    return { valid: false, message: 'Token Mistral inválido. Deve ser uma chave de API válida do Mistral.' };
  }
  
  return { valid: true, message: 'Token válido' };
}

// Função para obter melhores práticas
export function getBestPractices(provider: AiProvider): string[] {
  
  switch (provider) {
    case 'pollinations':
      return [
        'Use para testes e prototipagem rápida',
        'Limite o número de perguntas por requisição para melhor qualidade',
        'Evite horários de pico para melhor performance',
        'Use seeds consistentes para resultados reproduzíveis',
        'Para produção, considere Hugging Face ou Mistral'
      ];
      
    case 'huggingface':
      return [
        'Obtenha seu token gratuito em huggingface.co/settings/tokens',
        'Use o modelo principal para melhor qualidade',
        'Limite requisições para não exceder o rate limit',
        'Para múltiplas perguntas, divida em requisições menores',
        'Monitore o uso para evitar limites do plano gratuito'
      ];
      
    case 'mistral':
      return [
        'Obtenha sua chave de API em console.mistral.ai/api-keys',
        'Use o modelo mistral-large-2411 para melhor qualidade',
        'Monitore seu consumo para controlar custos',
        'Aproveite o contexto maior para perguntas mais complexas',
        'Use temperature ajustável para controlar criatividade'
      ];
      
    default:
      return [];
  }
}

// Função para obter informações de pricing
export function getPricingInfo(provider: AiProvider): {
  freeTier: string;
  limitations: string[];
  upgradeUrl?: string;
} {
  const config = getProviderConfig(provider);
  
  switch (provider) {
    case 'pollinations':
      return {
        freeTier: 'Totalmente gratuito',
        limitations: [
          'Rate limits públicos podem aplicar-se',
          'Menor prioridade em horários de pico',
          'Modelos limitados disponíveis',
          'Sem SLA garantido'
        ],
        upgradeUrl: config.documentation.signupUrl
      };
      
    case 'huggingface':
      return {
        freeTier: 'Plano gratuito disponível',
        limitations: [
          'Rate limits de 30 requisições/minuto',
          'Modelos podem ter tempo de carregamento',
          'Limites de tokens mensais',
          'Sem acesso a modelos premium'
        ],
        upgradeUrl: config.documentation.pricingUrl
      };
      
    case 'mistral':
      return {
        freeTier: 'Créditos gratuitos disponíveis',
        limitations: [
          'Cobrado por token utilizado',
          'Limites de taxa conforme plano',
          'Requer cartão de crédito após uso dos créditos',
          'Custos variam por modelo'
        ],
        upgradeUrl: config.documentation.pricingUrl
      };
      
    default:
      return {
        freeTier: 'Informação não disponível',
        limitations: [],
        upgradeUrl: undefined
      };
  }
}

// Exportar padrão com todas as funções
export default { getProviderConfig, getModelUrl, validateToken, getBestPractices, getPricingInfo };
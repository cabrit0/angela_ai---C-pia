import type { Question, QType, AiProvider } from '../../types';
import { generatePollinationsPrompt, generateHuggingFacePrompt, parseApiResponse } from '../utils/prompts';
import { generateImagesForQuestions, generateImageForQuestion } from '../utils/autoImageGeneration';

// Interface para os parâmetros de geração de perguntas
export interface GenerateQuestionsParams {
  provider: AiProvider;
  topic: string;
  grade?: string;
  questionType: QType;
  count: number;
  language?: string;
  token?: string; // Token para Hugging Face
}

// Função principal para gerar perguntas
export async function generateQuestions(params: GenerateQuestionsParams): Promise<Question[]> {
  const { provider } = params;
  
  try {
    switch (provider) {
      case 'pollinations':
        return await generateWithPollinations(params);
      case 'huggingface':
        return await generateWithHuggingFace(params);
      case 'mistral':
        return await generateWithMistral(params);
      default:
        throw new Error(`Provider não suportado: ${provider}`);
    }
  } catch (error) {
    // Log error silently for debugging but don't expose technical details to users
    console.error('Erro ao gerar perguntas:', error);
    
    // Return a more user-friendly error message
    throw new Error('Não foi possível gerar perguntas no momento. Tente novamente ou use outro provedor.');
  }
}

// Função principal para gerar perguntas com imagens automáticas
export async function generateQuestionsWithImages(
  params: GenerateQuestionsParams,
  imageProvider?: AiProvider,
  imageToken?: string
): Promise<Question[]> {
  const { provider, topic } = params;
  
  try {
    // First generate the questions without images
    const questions = await generateQuestions(params);
    
    // Always use Pollinations for image generation if no image provider is specified
    // This ensures images are generated regardless of the text provider selected
    const finalImageProvider = imageProvider || 'pollinations';
    
    console.log('Generating images for questions using provider:', finalImageProvider);
    console.log('Image token available:', !!imageToken);
    console.log('Text provider:', provider);
    
    try {
      const questionsWithImages = await generateImagesForQuestions(questions, topic, finalImageProvider, imageToken);
      console.log('Images generated successfully for', questionsWithImages.length, 'questions');
      
      // Log each question with its image URL for debugging
      questionsWithImages.forEach((q, index) => {
        console.log(`Question ${index + 1}:`, q.prompt, 'Image URL:', q.imageUrl);
      });
      
      return questionsWithImages;
    } catch (imageError) {
      console.error('Error generating images:', imageError);
      
      // Try to generate images one by one as fallback
      console.log('Attempting to generate images individually as fallback...');
      const questionsWithIndividualImages = [...questions];
      
      for (let i = 0; i < questions.length; i++) {
        try {
          console.log(`Generating image for question ${i + 1}/${questions.length}`);
          const imageUrl = await generateImageForQuestion(
            questions[i],
            topic,
            finalImageProvider,
            imageToken
          );
          
          if (imageUrl) {
            questionsWithIndividualImages[i] = {
              ...questionsWithIndividualImages[i],
              imageUrl
            };
            console.log(`Successfully generated image for question ${i + 1}`);
          } else {
            console.log(`Failed to generate image for question ${i + 1}, continuing without image`);
          }
        } catch (individualError) {
          console.error(`Failed to generate image for question ${i + 1}:`, individualError);
          // Continue with next question even if this one fails
        }
      }
      
      console.log('Fallback image generation completed');
      return questionsWithIndividualImages;
    }
  } catch (error) {
    // Log error silently for debugging but don't expose technical details to users
    console.error('Erro ao gerar perguntas com imagens:', error);
    
    // Return a more user-friendly error message
    throw new Error('Não foi possível gerar perguntas no momento. Tente novamente ou use outro provedor.');
  }
}

// Implementação para Pollinations (sem chave, gratuito)
async function generateWithPollinations(params: GenerateQuestionsParams): Promise<Question[]> {
  const { topic, grade, questionType, count, language } = params;
  
  const prompt = generatePollinationsPrompt({
    topic,
    grade,
    questionType,
    count,
    language
  });

  try {
    // Usar endpoint mais recente e estável do Pollinations
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai', // Modelo padrão do Pollinations
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: Math.min(2000, count * 300), // Ajustar tokens baseado no número de perguntas
        seed: -1 // Garantir resultados consistentes
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Erro na API Pollinations: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';
    
    if (!generatedText) {
      throw new Error('Resposta vazia da API Pollinations');
    }

    const parsedQuestions = parseApiResponse(generatedText, questionType);
    
    // Converter para o formato Question
    return parsedQuestions.map((q, index) => convertToQuestionFormat(q, questionType, index.toString()));
  } catch (error) {
    console.error('Erro na chamada à API Pollinations:', error);
    
    // Tentar fallback com modelo alternativo se houver erro
    if (error instanceof Error && error.message.includes('429')) {
      console.log('Tentando fallback com modelo alternativo...');
      return await generateWithPollinationsFallback(params);
    }
    
    // Return user-friendly error message
    throw new Error('Não foi possível gerar perguntas com Pollinations. Tente novamente mais tarde.');
  }
}

// Função de fallback para Pollinations com diferentes parâmetros
async function generateWithPollinationsFallback(params: GenerateQuestionsParams): Promise<Question[]> {
  const { topic, grade, questionType, count, language } = params;
  
  const prompt = generatePollinationsPrompt({
    topic,
    grade,
    questionType,
    count: Math.min(count, 3), // Limitar para fallback
    language
  });

  try {
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        seed: 42 // Seed fixo para consistência
      })
    });

    if (!response.ok) {
      throw new Error(`Fallback Pollinations falhou: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';
    
    if (!generatedText) {
      throw new Error('Resposta vazia do fallback Pollinations');
    }

    const parsedQuestions = parseApiResponse(generatedText, questionType);
    
    return parsedQuestions.map((q, index) => convertToQuestionFormat(q, questionType, index.toString()));
  } catch (error) {
    console.error('Erro no fallback Pollinations:', error);
    throw new Error('Serviço temporariamente indisponível. Tente novamente em alguns minutos.');
  }
}

// Implementação para Hugging Face (com token gratuito)
async function generateWithHuggingFace(params: GenerateQuestionsParams): Promise<Question[]> {
  const { topic, grade, questionType, count, language, token } = params;
  
  if (!token) {
    throw new Error('Token do Hugging Face é necessário para usar este serviço');
  }

  const prompt = generateHuggingFacePrompt({
    topic,
    grade,
    questionType,
    count,
    language
  });

  try {
    // Tentar com modelo principal gratuito e confiável
    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: Math.min(2000, count * 300),
          temperature: 0.7,
          return_full_text: false,
          do_sample: true,
          top_p: 0.9,
          top_k: 50
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error('Token do Hugging Face inválido ou expirado. Verifique seu token em huggingface.co/settings/tokens');
      } else if (response.status === 429) {
        throw new Error('Limite de taxa da API Hugging Face excedido. Tente novamente em alguns minutos.');
      } else if (response.status === 503) {
        // Modelo está carregando - tentar fallback
        console.log('Modelo principal indisponível, tentando fallback...');
        return await generateWithHuggingFaceFallback(params);
      } else if (response.status === 400) {
        throw new Error(`Parâmetros inválidos: ${errorData.error || 'Verifique seu token e permissões'}`);
      }
      
      throw new Error(`Erro na API Hugging Face: ${response.status} ${response.statusText} - ${errorData.error || ''}`);
    }

    const data = await response.json();
    
    // Verificar se há erro na resposta
    if (data.error) {
      throw new Error(`Erro do modelo: ${data.error}`);
    }
    
    const generatedText = data?.[0]?.generated_text || '';
    
    if (!generatedText) {
      throw new Error('Resposta vazia da API Hugging Face. Tente novamente.');
    }

    const parsedQuestions = parseApiResponse(generatedText, questionType);
    
    // Converter para o formato Question
    return parsedQuestions.map((q, index) => convertToQuestionFormat(q, questionType, index.toString()));
  } catch (error) {
    console.error('Erro na chamada à API Hugging Face:', error);
    
    // Se for erro de modelo indisponível, tentar fallback
    if (error instanceof Error && error.message.includes('503')) {
      return await generateWithHuggingFaceFallback(params);
    }
    
    // Return user-friendly error messages instead of technical details
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('Token inválido. Verifique seu token nas configurações.');
      } else if (error.message.includes('429')) {
        throw new Error('Muitas solicitações. Aguarde alguns minutos antes de tentar novamente.');
      } else if (error.message.includes('400')) {
        throw new Error('Parâmetros inválidos. Verifique sua configuração.');
      }
    }
    throw new Error('Não foi possível gerar perguntas com Hugging Face. Tente novamente.');
  }
}

// Função de fallback para Hugging Face com modelo alternativo
async function generateWithHuggingFaceFallback(params: GenerateQuestionsParams): Promise<Question[]> {
  const { topic, grade, questionType, count, language, token } = params;
  
  const prompt = generateHuggingFacePrompt({
    topic,
    grade,
    questionType,
    count: Math.min(count, 3), // Limitar para fallback
    language
  });

  try {
    // Usar modelo alternativo mais leve e rápido
    const response = await fetch('https://api-inference.huggingface.co/models/TinyLlama/TinyLlama-1.1B-Chat-v1.0', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.6,
          return_full_text: false,
          do_sample: true
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Fallback Hugging Face falhou: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Erro no modelo fallback: ${data.error}`);
    }
    
    const generatedText = data?.[0]?.generated_text || '';
    
    if (!generatedText) {
      throw new Error('Resposta vazia do fallback Hugging Face');
    }

    const parsedQuestions = parseApiResponse(generatedText, questionType);
    
    return parsedQuestions.map((q, index) => convertToQuestionFormat(q, questionType, index.toString()));
  } catch (error) {
    console.error('Erro no fallback Hugging Face:', error);
    throw new Error('Serviço temporariamente indisponível. Tente usar outro provedor ou aguarde alguns minutos.');
  }
}

// Implementação para Mistral (com chave de API)
async function generateWithMistral(params: GenerateQuestionsParams): Promise<Question[]> {
  const { topic, grade, questionType, count, language, token } = params;
  
  if (!token) {
    throw new Error('Chave de API do Mistral é necessária para usar este serviço');
  }

  // Usar o mesmo prompt do Hugging Face pois é compatível
  const prompt = generateHuggingFacePrompt({
    topic,
    grade,
    questionType,
    count,
    language
  });

  try {
    // Usar endpoint da API do Mistral
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-large-2411',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: Math.min(4000, count * 400),
        temperature: 0.7,
        top_p: 0.9
        // Remove top_k as it's not supported by Mistral API
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error('Chave de API do Mistral inválida ou expirada. Verifique sua chave em console.mistral.ai/api-keys');
      } else if (response.status === 429) {
        throw new Error('Limite de taxa da API Mistral excedido. Tente novamente em alguns minutos.');
      } else if (response.status === 400) {
        throw new Error(`Parâmetros inválidos: ${errorData.error?.message || errorData.error || 'Verifique sua chave e permissões'}`);
      } else if (response.status === 404) {
        throw new Error('Modelo Mistral não encontrado. Verificando modelo alternativo...');
      } else if (response.status === 500) {
        throw new Error('Erro interno do servidor Mistral. Tente novamente mais tarde.');
      }
      
      throw new Error(`Erro na API Mistral: ${response.status} ${response.statusText} - ${errorData.error?.message || errorData.error || ''}`);
    }

    const data = await response.json();
    
    // Verificar se há erro na resposta
    if (data.error) {
      throw new Error(`Erro do modelo: ${data.error.message || data.error}`);
    }
    
    const generatedText = data.choices?.[0]?.message?.content || '';
    
    if (!generatedText) {
      throw new Error('Resposta vazia da API Mistral. Tente novamente.');
    }

    const parsedQuestions = parseApiResponse(generatedText, questionType);
    
    // Converter para o formato Question
    return parsedQuestions.map((q, index) => convertToQuestionFormat(q, questionType, index.toString()));
  } catch (error) {
    console.error('Erro na chamada à API Mistral:', error);
    
    // Se for erro de modelo indisponível, tentar fallback
    if (error instanceof Error && (error.message.includes('model') || error.message.includes('503') || error.message.includes('404'))) {
      try {
        return await generateWithMistralFallback(params);
      } catch (fallbackError) {
        // Se o fallback também falhar, tentar com um modelo mais antigo
        return await generateWithMistralLegacyFallback(params);
      }
    }
    
    // Return user-friendly error messages instead of technical details
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('Chave de API inválida. Verifique sua chave nas configurações.');
      } else if (error.message.includes('429')) {
        throw new Error('Muitas solicitações. Aguarde alguns minutos antes de tentar novamente.');
      } else if (error.message.includes('400')) {
        throw new Error('Parâmetros inválidos. Verifique sua configuração.');
      }
    }
    throw new Error('Não foi possível gerar perguntas com Mistral. Tente novamente.');
  }
}

// Função de fallback para Mistral com modelo alternativo
async function generateWithMistralFallback(params: GenerateQuestionsParams): Promise<Question[]> {
  const { topic, grade, questionType, count, language, token } = params;
  
  const prompt = generateHuggingFacePrompt({
    topic,
    grade,
    questionType,
    count: Math.min(count, 5), // Limitar para fallback
    language
  });

  try {
    // Usar modelo alternativo menor e mais rápido
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-2411', // Updated to a valid model name
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.6
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error('Chave de API do Mistral inválida. Verifique suas configurações.');
      } else if (response.status === 429) {
        throw new Error('Limite de taxa excedido. Aguarde alguns minutos.');
      } else if (response.status === 404) {
        throw new Error('Modelo alternativo não encontrado. Tente usar outro provedor.');
      }
      
      throw new Error(`Fallback Mistral falhou: ${response.status} - ${errorData.error?.message || errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Erro no modelo fallback: ${data.error.message || data.error}`);
    }
    
    const generatedText = data.choices?.[0]?.message?.content || '';
    
    if (!generatedText) {
      throw new Error('Resposta vazia do fallback Mistral');
    }

    const parsedQuestions = parseApiResponse(generatedText, questionType);
    
    return parsedQuestions.map((q, index) => convertToQuestionFormat(q, questionType, index.toString()));
  } catch (error) {
    console.error('Erro no fallback Mistral:', error);
    throw new Error('Serviço temporariamente indisponível. Tente usar outro provedor ou aguarde alguns minutos.');
  }
}

// Função de fallback legado para Mistral com modelo mais antigo e estável
async function generateWithMistralLegacyFallback(params: GenerateQuestionsParams): Promise<Question[]> {
  const { topic, grade, questionType, count, language, token } = params;
  
  const prompt = generateHuggingFacePrompt({
    topic,
    grade,
    questionType,
    count: Math.min(count, 3), // Limitar para fallback legado
    language
  });

  try {
    // Usar modelo mais antigo e estável
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-tiny', // Modelo mais antigo e estável
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.5
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Fallback legado Mistral falhou: ${response.status} - ${errorData.error?.message || errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Erro no modelo legado: ${data.error.message || data.error}`);
    }
    
    const generatedText = data.choices?.[0]?.message?.content || '';
    
    if (!generatedText) {
      throw new Error('Resposta vazia do fallback legado Mistral');
    }

    const parsedQuestions = parseApiResponse(generatedText, questionType);
    
    return parsedQuestions.map((q, index) => convertToQuestionFormat(q, questionType, index.toString()));
  } catch (error) {
    console.error('Erro no fallback legado Mistral:', error);
    throw new Error('Todos os modelos Mistral estão indisponíveis. Tente usar Hugging Face ou Pollinations.');
  }
}

// Função para converter o formato parseado para o formato Question
const ORDERING_SPLIT_REGEX = />|\u2192|\u2794|->|,|;/;

function convertToQuestionFormat(parsed: any, questionType: QType, id: string): Question {
  console.log('convertToQuestionFormat called with:', { parsed, questionType, id });
  
  const baseQuestion = {
    id,
    type: questionType,
    prompt: parsed.prompt || '',
    // Remove explanation field as it's not part of the Question interface
  };

  switch (questionType) {
    case 'mcq':
      const mcqQuestion = {
        ...baseQuestion,
        choices: (parsed.choices || []).map((choice: string, index: number) => ({
          id: index.toString(),
          text: choice,
          correct: index === parsed.correct
        }))
      };
      console.log('Converted MCQ question:', mcqQuestion);
      return mcqQuestion;

    case 'truefalse':
      const tfQuestion = {
        ...baseQuestion,
        choices: [
          { id: '0', text: 'Verdadeiro', correct: parsed.correct === true },
          { id: '1', text: 'Falso', correct: parsed.correct === false }
        ]
      };
      console.log('Converted True/False question:', tfQuestion);
      return tfQuestion;

    case 'short':
    case 'gapfill':
    case 'essay':
      // Ensure answer is always a string, even if AI returns an object
      let answerText = '';
      if (typeof parsed.answer === 'string') {
        answerText = parsed.answer;
      } else if (parsed.answer && typeof parsed.answer === 'object') {
        // Extract text from common object properties
        answerText = parsed.answer.text || parsed.answer.answer || parsed.answer.content || JSON.stringify(parsed.answer);
      }
      const shortQuestion = {
        ...baseQuestion,
        answer: answerText
      };
      console.log(`Converted ${questionType} question:`, shortQuestion);
      return shortQuestion;

    case 'matching':
      const matchingQuestion = {
        ...baseQuestion,
        matchingPairs: (parsed.matchingPairs || []).map((pair: any, index: number) => ({
          id: index.toString(),
          leftItem: pair.leftItem || '',
          rightItem: pair.rightItem || ''
        }))
      };
      console.log('Converted Matching question:', matchingQuestion);
      return matchingQuestion;

    case 'ordering':
      const rawOrdering = Array.isArray(parsed.orderingItems)
        ? parsed.orderingItems
        : Array.isArray(parsed.items)
          ? parsed.items
          : Array.isArray(parsed.sequence)
            ? parsed.sequence
            : typeof parsed.sequence === 'string'
              ? parsed.sequence.split(ORDERING_SPLIT_REGEX)
              : typeof parsed.answer === 'string'
                ? parsed.answer.split(ORDERING_SPLIT_REGEX)
                : [];
      const orderingItems = rawOrdering
        .map((item: any) => (typeof item === 'string' ? item : String(item || '')).trim())
        .filter((item: string) => item.length > 0);
      const orderingQuestion = {
        ...baseQuestion,
        orderingItems,
        answer: orderingItems.join(' -> ')
      };
      console.log('Converted Ordering question:', orderingQuestion);
      return orderingQuestion;

    default:
      throw new Error(`Tipo de pergunta não suportado: ${questionType}`);
  }
}

// Função para testar conectividade com os provedores
export async function testProviderConnection(provider: AiProvider, token?: string): Promise<{ success: boolean; message: string }> {
  try {
    const testParams: GenerateQuestionsParams = {
      provider,
      topic: 'teste',
      questionType: 'mcq',
      count: 1,
      token
    };

    await generateQuestions(testParams);
    
    let providerName = '';
    switch (provider) {
      case 'pollinations':
        providerName = 'Pollinations';
        break;
      case 'huggingface':
        providerName = 'Hugging Face';
        break;
      case 'mistral':
        providerName = 'Mistral';
        break;
    }
    
    return {
      success: true,
      message: `Conexão com ${providerName} estabelecida com sucesso`
    };
  } catch (error) {
    return {
      success: false,
      message: `Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

// Função para obter informações sobre os provedores
export function getProviderInfo(provider: AiProvider): {
  name: string;
  description: string;
  requiresToken: boolean;
  tokenLabel: string;
  tokenHelp: string;
  rateLimit: string;
} {
  switch (provider) {
    case 'pollinations':
      return {
        name: 'Pollinations',
        description: 'Serviço gratuito sem necessidade de registro ou chave de API',
        requiresToken: false,
        tokenLabel: '',
        tokenHelp: '',
        rateLimit: 'Limites públicos podem aplicar-se em horários de pico'
      };

    case 'huggingface':
      return {
        name: 'Hugging Face',
        description: 'Modelos de IA avançados com token gratuito',
        requiresToken: true,
        tokenLabel: 'Token Hugging Face',
        tokenHelp: 'Obtenha seu token gratuito em: huggingface.co/settings/tokens',
        rateLimit: 'Limite de taxa aplicável para usuários gratuitos'
      };

    case 'mistral':
      return {
        name: 'Mistral',
        description: 'API direta do Mistral com modelos de alta qualidade',
        requiresToken: true,
        tokenLabel: 'Chave de API Mistral',
        tokenHelp: 'Obtenha sua chave de API em: console.mistral.ai/api-keys',
        rateLimit: 'Limite de taxa conforme plano contratado'
      };

    default:
      throw new Error(`Provider não reconhecido: ${provider}`);
  }
}

// Função para gerar texto de suporte para o quiz
export async function generateSupportText(
  params: GenerateQuestionsParams & { questions?: any[] }
): Promise<string> {
  const { provider, topic, grade, language, token, questions } = params;
  
  try {
    switch (provider) {
      case 'pollinations':
        return await generateSupportWithPollinations(topic, grade, language, questions);
      case 'huggingface':
        return await generateSupportWithHuggingFace(topic, grade, language, token, questions);
      case 'mistral':
        return await generateSupportWithMistral(topic, grade, language, token, questions);
      default:
        throw new Error(`Provider não suportado: ${provider}`);
    }
  } catch (error) {
    console.error('Erro ao gerar texto de suporte:', error);
    throw new Error('Não foi possível gerar texto de suporte. Tente novamente.');
  }
}

// Implementação para Pollinations
async function generateSupportWithPollinations(
  topic: string,
  grade?: string,
  language?: string,
  questions?: any[]
): Promise<string> {
  // Preparar um resumo das perguntas para contextualizar a IA
  let questionsContext = '';
  if (questions && questions.length > 0) {
    questionsContext = '\n\nPerguntas do quiz:\n';
    questions.forEach((q, index) => {
      questionsContext += `${index + 1}. ${q.prompt}`;
      
      if (q.type === 'mcq' && q.choices) {
        const optionsText = q.choices.map((c: any) => c.text).join(', ');
        questionsContext += ` (Opções: ${optionsText})`;
      } else if (q.type === 'truefalse') {
        questionsContext += ' (Verdadeiro ou Falso)';
      } else if (q.type === 'short' || q.type === 'gapfill' || q.type === 'essay') {
        questionsContext += ' (Resposta aberta)';
      } else if (q.type === 'matching' && q.matchingPairs) {
        const pairsText = q.matchingPairs.map((p: any) => `${p.leftItem} -> ${p.rightItem}`).join(', ');
        questionsContext += ` (Associar: ${pairsText})`;
      } else if (q.type === 'ordering' && q.orderingItems) {
        questionsContext += ` (Ordenar: ${q.orderingItems.join(' -> ')})`;
      }
      
      questionsContext += '\n';
    });
  }

  const prompt = `Gere um texto de suporte educacional completo e detalhado para um quiz sobre "${topic}"${grade ? ` para alunos de ${grade}` : ''}${questionsContext}.
  
  O texto deve:
  1. Fornecer contexto e informações relevantes sobre o tema
  2. Incluir dicas úteis que ajudem os estudantes a responder melhor às perguntas específicas
  3. Fazer referência aos tipos de perguntas e fornecer orientações específicas
  4. Ser escrito em português${language && language !== 'pt' ? ` (${language})` : ''}
  5. Ter entre 400-600 palavras para ser completo e detalhado
  6. Ser claro, objetivo e educativo
  7. Não dar as respostas diretamente, mas sim orientações sobre como abordar cada tipo de pergunta
  8. Incluir exemplos práticos quando relevante
  9. Estruturar o conteúdo com parágrafos bem definidos para melhor leitura
  
  IMPORTANTE: O texto deve ser completo e não cortado. Desenvolva todos os pontos mencionados acima de forma detalhada.
  
  Responda apenas com o texto de suporte completo, sem explicações adicionais.`;

  try {
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        seed: -1
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API Pollinations: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Erro na chamada à API Pollinations:', error);
    throw new Error('Não foi possível gerar texto de suporte com Pollinations.');
  }
}

// Implementação para Hugging Face
async function generateSupportWithHuggingFace(
  topic: string,
  grade?: string,
  language?: string,
  token?: string,
  questions?: any[]
): Promise<string> {
  if (!token) {
    throw new Error('Token do Hugging Face é necessário');
  }

  // Preparar um resumo das perguntas para contextualizar a IA
  let questionsContext = '';
  if (questions && questions.length > 0) {
    questionsContext = '\n\nPerguntas do quiz:\n';
    questions.forEach((q, index) => {
      questionsContext += `${index + 1}. ${q.prompt}`;
      
      if (q.type === 'mcq' && q.choices) {
        const optionsText = q.choices.map((c: any) => c.text).join(', ');
        questionsContext += ` (Opções: ${optionsText})`;
      } else if (q.type === 'truefalse') {
        questionsContext += ' (Verdadeiro ou Falso)';
      } else if (q.type === 'short' || q.type === 'gapfill' || q.type === 'essay') {
        questionsContext += ' (Resposta aberta)';
      } else if (q.type === 'matching' && q.matchingPairs) {
        const pairsText = q.matchingPairs.map((p: any) => `${p.leftItem} -> ${p.rightItem}`).join(', ');
        questionsContext += ` (Associar: ${pairsText})`;
      } else if (q.type === 'ordering' && q.orderingItems) {
        questionsContext += ` (Ordenar: ${q.orderingItems.join(' -> ')})`;
      }
      
      questionsContext += '\n';
    });
  }

  const prompt = `Gere um texto de suporte educacional completo e detalhado para um quiz sobre "${topic}"${grade ? ` para alunos de ${grade}` : ''}${questionsContext}.
  
  O texto deve:
  1. Fornecer contexto e informações relevantes sobre o tema
  2. Incluir dicas úteis que ajudem os estudantes a responder melhor às perguntas específicas
  3. Fazer referência aos tipos de perguntas e fornecer orientações específicas
  4. Ser escrito em português${language && language !== 'pt' ? ` (${language})` : ''}
  5. Ter entre 400-600 palavras para ser completo e detalhado
  6. Ser claro, objetivo e educativo
  7. Não dar as respostas diretamente, mas sim orientações sobre como abordar cada tipo de pergunta
  8. Incluir exemplos práticos quando relevante
  9. Estruturar o conteúdo com parágrafos bem definidos para melhor leitura
  
  IMPORTANTE: O texto deve ser completo e não cortado. Desenvolva todos os pontos mencionados acima de forma detalhada.
  
  Responda apenas com o texto de suporte completo, sem explicações adicionais.`;

  try {
    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1500,
          temperature: 0.7,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API Hugging Face: ${response.status}`);
    }

    const data = await response.json();
    return data?.[0]?.generated_text || '';
  } catch (error) {
    console.error('Erro na chamada à API Hugging Face:', error);
    throw new Error('Não foi possível gerar texto de suporte com Hugging Face.');
  }
}

// Implementação para Mistral
async function generateSupportWithMistral(
  topic: string,
  grade?: string,
  language?: string,
  token?: string,
  questions?: any[]
): Promise<string> {
  if (!token) {
    throw new Error('Chave de API do Mistral é necessária');
  }

  // Preparar um resumo das perguntas para contextualizar a IA
  let questionsContext = '';
  if (questions && questions.length > 0) {
    questionsContext = '\n\nPerguntas do quiz:\n';
    questions.forEach((q, index) => {
      questionsContext += `${index + 1}. ${q.prompt}`;
      
      if (q.type === 'mcq' && q.choices) {
        const optionsText = q.choices.map((c: any) => c.text).join(', ');
        questionsContext += ` (Opções: ${optionsText})`;
      } else if (q.type === 'truefalse') {
        questionsContext += ' (Verdadeiro ou Falso)';
      } else if (q.type === 'short' || q.type === 'gapfill' || q.type === 'essay') {
        questionsContext += ' (Resposta aberta)';
      } else if (q.type === 'matching' && q.matchingPairs) {
        const pairsText = q.matchingPairs.map((p: any) => `${p.leftItem} -> ${p.rightItem}`).join(', ');
        questionsContext += ` (Associar: ${pairsText})`;
      } else if (q.type === 'ordering' && q.orderingItems) {
        questionsContext += ` (Ordenar: ${q.orderingItems.join(' -> ')})`;
      }
      
      questionsContext += '\n';
    });
  }

  const prompt = `Gere um texto de suporte educacional completo e detalhado para um quiz sobre "${topic}"${grade ? ` para alunos de ${grade}` : ''}${questionsContext}.
  
  O texto deve:
  1. Fornecer contexto e informações relevantes sobre o tema
  2. Incluir dicas úteis que ajudem os estudantes a responder melhor às perguntas específicas
  3. Fazer referência aos tipos de perguntas e fornecer orientações específicas
  4. Ser escrito em português${language && language !== 'pt' ? ` (${language})` : ''}
  5. Ter entre 400-600 palavras para ser completo e detalhado
  6. Ser claro, objetivo e educativo
  7. Não dar as respostas diretamente, mas sim orientações sobre como abordar cada tipo de pergunta
  8. Incluir exemplos práticos quando relevante
  9. Estruturar o conteúdo com parágrafos bem definidos para melhor leitura
  
  IMPORTANTE: O texto deve ser completo e não cortado. Desenvolva todos os pontos mencionados acima de forma detalhada.
  
  Responda apenas com o texto de suporte completo, sem explicações adicionais.`;

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-large-2411',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API Mistral: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Erro na chamada à API Mistral:', error);
    throw new Error('Não foi possível gerar texto de suporte com Mistral.');
  }
}

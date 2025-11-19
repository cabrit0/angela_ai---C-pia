import type { AiProvider } from '../../types/settings';

// Interface para os parâmetros de geração de imagens
export interface GenerateImageParams {
  provider: AiProvider;
  prompt: string;
  token?: string; // Token para Hugging Face
  width?: number; // Largura da imagem (padrão: 512)
  height?: number; // Altura da imagem (padrão: 512)
  steps?: number; // Passos de geração (padrão: 20)
}

// Interface para o resultado da geração
export interface GenerateImageResult {
  imageUrl: string;
  provider: AiProvider;
  prompt: string;
  timestamp: number;
}

// Função principal para gerar imagens
export async function generateImage(params: GenerateImageParams): Promise<GenerateImageResult> {
  const { provider, prompt } = params;
  
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('O prompt não pode estar vazio');
  }
  
  try {
    switch (provider) {
      case 'pollinations':
        return await generateWithPollinations(params);
      case 'huggingface':
        return await generateWithHuggingFace(params);
      default:
        throw new Error(`Provider não suportado: ${provider}`);
    }
  } catch (error) {
    console.error('Erro ao gerar imagem:', error);
    throw new Error(`Falha ao gerar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

// Implementação para Pollinations (sem chave, gratuito)
async function generateWithPollinations(params: GenerateImageParams): Promise<GenerateImageResult> {
  const { prompt, width = 512, height = 512 } = params;
  
  try {
    // Pollinations usa uma URL simples para gerar imagens
    // Codificamos o prompt para URL
    const encodedPrompt = encodeURIComponent(prompt.trim());
    
    // Adicionar timestamp e parâmetros para evitar cache e garantir geração única
    const timestamp = Date.now();
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&t=${timestamp}`;
    
    console.log('Pollinations image URL:', imageUrl);
    
    // Não verificamos a imagem antecipadamente para evitar problemas de CORS
    // Em vez disso, confiamos que a API do Pollinations funcionará
    // A validação ocorrerá quando a imagem for carregada no navegador
    
    return {
      imageUrl,
      provider: 'pollinations',
      prompt: prompt.trim(),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Erro na chamada à API Pollinations:', error);
    throw new Error(`Erro ao comunicar com Pollinations: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

// Implementação para Hugging Face (com token gratuito)
async function generateWithHuggingFace(params: GenerateImageParams): Promise<GenerateImageResult> {
  const { prompt, token, width = 512, height = 512, steps = 20 } = params;
  
  if (!token) {
    throw new Error('Token do Hugging Face é necessário para usar este serviço');
  }
  
  try {
    // Usar o modelo stabilityai/stable-diffusion-2-1 (disponível no free tier)
    const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt.trim(),
        parameters: {
          width,
          height,
          num_inference_steps: steps,
          guidance_scale: 7.5,
          negative_prompt: 'blurry, bad quality, distorted, deformed'
        }
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token do Hugging Face inválido ou expirado');
      } else if (response.status === 429) {
        throw new Error('Limite de taxa da API Hugging Face excedido. Tente novamente mais tarde.');
      } else if (response.status === 503) {
        throw new Error('Modelo Hugging Face indisponível. Tente novamente mais tarde.');
      }
      throw new Error(`Erro na API Hugging Face: ${response.status} ${response.statusText}`);
    }

    // A resposta é um blob de imagem
    const imageBlob = await response.blob();
    
    // Converter o blob para uma URL de dados
    const imageUrl = URL.createObjectURL(imageBlob);
    
    return {
      imageUrl,
      provider: 'huggingface',
      prompt: prompt.trim(),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Erro na chamada à API Hugging Face:', error);
    if (error instanceof Error) {
      throw error; // Repassar erros específicos
    }
    throw new Error(`Erro ao comunicar com Hugging Face: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

// Função para testar conectividade com os provedores de imagem
export async function testImageProviderConnection(provider: AiProvider, token?: string): Promise<{ success: boolean; message: string }> {
  try {
    const testParams: GenerateImageParams = {
      provider,
      prompt: 'test image',
      token,
      width: 256, // Usar dimensões menores para teste
      height: 256,
      steps: 10 // Menos passos para teste
    };

    await generateImage(testParams);
    
    return {
      success: true,
      message: `Conexão com ${provider === 'pollinations' ? 'Pollinations' : 'Hugging Face'} para imagens estabelecida com sucesso`
    };
  } catch (error) {
    return {
      success: false,
      message: `Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

// Função para obter informações sobre os provedores de imagem
export function getImageProviderInfo(provider: AiProvider): {
  name: string;
  description: string;
  requiresToken: boolean;
  tokenLabel: string;
  tokenHelp: string;
  rateLimit: string;
  maxDimensions: { width: number; height: number };
} {
  switch (provider) {
    case 'pollinations':
      return {
        name: 'Pollinations',
        description: 'Serviço gratuito de geração de imagens sem necessidade de registro',
        requiresToken: false,
        tokenLabel: '',
        tokenHelp: '',
        rateLimit: 'Limites públicos podem aplicar-se em horários de pico',
        maxDimensions: { width: 1024, height: 1024 }
      };

    case 'huggingface':
      return {
        name: 'Hugging Face',
        description: 'Modelo Stable Diffusion avançado com token gratuito',
        requiresToken: true,
        tokenLabel: 'Token Hugging Face',
        tokenHelp: 'Obtenha seu token gratuito em: huggingface.co/settings/tokens',
        rateLimit: 'Limite de taxa aplicável para usuários gratuitos',
        maxDimensions: { width: 512, height: 512 }
      };

    default:
      throw new Error(`Provider não reconhecido: ${provider}`);
  }
}

// Função para liberar URLs de objetos criados pelo Hugging Face
export function revokeImageUrl(imageUrl: string): void {
  if (imageUrl.startsWith('blob:')) {
    URL.revokeObjectURL(imageUrl);
  }
}
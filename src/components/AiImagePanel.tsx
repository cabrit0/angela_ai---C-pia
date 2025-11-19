import React, { useState, useEffect } from 'react';
import { generateImage, revokeImageUrl, type GenerateImageResult } from '../lib/api/aiImage';
import type { AppSettings } from '../types/settings';
import { loadSettings } from '../lib/utils/storage';

interface AiImagePanelProps {
  onImageGenerated: (imageUrl: string) => void;
  onClose: () => void;
}

const AiImagePanel: React.FC<AiImagePanelProps> = ({ onImageGenerated, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GenerateImageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings] = useState<AppSettings>(loadSettings());

  useEffect(() => {
    // Limpar URLs de objetos quando o componente for desmontado
    return () => {
      if (generatedImage) {
        revokeImageUrl(generatedImage.imageUrl);
      }
    };
  }, [generatedImage]);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError('Por favor, digite um prompt para a imagem');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateImage({
        provider: settings.imageProvider,
        prompt: prompt.trim(),
        token: settings.huggingFaceToken,
        width: 512,
        height: 512,
        steps: 20
      });

      // Limpar imagem anterior se existir
      if (generatedImage) {
        revokeImageUrl(generatedImage.imageUrl);
      }

      setGeneratedImage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar imagem');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddImageToQuestion = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage.imageUrl);
      onClose();
    }
  };

  const handleRegenerateImage = () => {
    handleGenerateImage();
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (error) {
      setError(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleGenerateImage();
    }
  };

  const getProviderName = () => {
    return settings.imageProvider === 'pollinations' ? 'Pollinations' : 'Hugging Face';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Gerar Imagem com IA</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Fechar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Usando: <span className="font-medium">{getProviderName()}</span>
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="image-prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição da Imagem
            </label>
            <textarea
              id="image-prompt"
              value={prompt}
              onChange={handlePromptChange}
              onKeyPress={handleKeyPress}
              placeholder="Descreva a imagem que deseja gerar... (ex: Um céu estrelado sobre uma montanha)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              disabled={isGenerating}
            />
            <p className="mt-1 text-xs text-gray-500">
              Pressione Ctrl+Enter para gerar a imagem
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating || !prompt.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  A gerar imagem...
                </>
              ) : (
                'Gerar Imagem'
              )}
            </button>
          </div>

          {generatedImage && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Imagem Gerada</h3>
              
              <div className="mb-4">
                <div className="flex justify-center">
                  <img
                    src={generatedImage.imageUrl}
                    alt="Imagem gerada por IA"
                    className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm max-h-96 object-contain"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Prompt: "{generatedImage.prompt}"
                </p>
                <p className="text-xs text-gray-400 text-center">
                  Gerado em: {new Date(generatedImage.timestamp).toLocaleString('pt-PT')}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAddImageToQuestion}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Adicionar à Pergunta
                </button>
                <button
                  onClick={handleRegenerateImage}
                  disabled={isGenerating}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      A gerar...
                    </>
                  ) : (
                    'Gerar Novamente'
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-700">
              <strong>Dica:</strong> Seja específico na descrição para obter melhores resultados. 
              Experimente descrever o estilo, cores e elementos que deseja na imagem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiImagePanel;
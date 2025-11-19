import React, { useEffect, useRef, useState } from 'react';
import type { Quiz, Question, AiProvider } from '../types';
import { generateSupportText } from '../lib/api/aiText';

interface SupportTextFormProps {
  quiz: Quiz;
  questions: Question[];
  onUpdateSupportText: (supportText: string) => void;
  aiProvider?: AiProvider;
  aiToken?: string;
}

const SupportTextForm: React.FC<SupportTextFormProps> = ({ 
  quiz, 
  questions, 
  onUpdateSupportText,
  aiProvider = 'pollinations',
  aiToken = ''
}) => {
  const [supportText, setSupportText] = useState(quiz.supportText || '');
  const [isGeneratingSupport, setIsGeneratingSupport] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const messageTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Validate quiz ID before using it
    if (!quiz.id || quiz.id === 'undefined' || quiz.id === 'null' || quiz.id.trim() === '') {
      console.error('[SupportTextForm] Invalid quiz ID:', quiz.id);
      return;
    }
    
    console.log('[SupportTextForm] Using quiz ID:', quiz.id);
    setSupportText(quiz.supportText || '');
  }, [quiz.id, quiz.supportText]);

  const handleGenerateSupportText = async () => {
    if (questions.length === 0) {
      alert('Por favor, adicione perguntas ao quiz antes de gerar o texto de suporte.');
      return;
    }

    setIsGeneratingSupport(true);
    try {
      const generatedText = await generateSupportText({
        provider: aiProvider,
        topic: quiz.title,
        grade: quiz.grade || undefined,
        questionType: 'mcq', // Tipo padrão, não usado para gerar suporte
        count: 1, // Valor padrão, não usado para gerar suporte
        language: 'pt',
        token: aiToken,
        questions: questions // Passar as perguntas para contextualizar a IA
      });
      
      setSupportText(generatedText);
      onUpdateSupportText(generatedText);
      setSaveMessage('Texto de suporte criado automaticamente e guardado.');
      if (messageTimeout.current) {
        clearTimeout(messageTimeout.current);
      }
      messageTimeout.current = setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao gerar texto de suporte:', error);
      alert(error instanceof Error ? error.message : 'Erro ao gerar texto de suporte. Tente novamente.');
    } finally {
      setIsGeneratingSupport(false);
    }
  };

  useEffect(() => {
    return () => {
      if (messageTimeout.current) {
        clearTimeout(messageTimeout.current);
      }
    };
  }, []);

  const handleSaveSupportText = () => {
    onUpdateSupportText(supportText);
    setSaveMessage('Texto de suporte guardado com sucesso!');
    if (messageTimeout.current) {
      clearTimeout(messageTimeout.current);
    }
    messageTimeout.current = setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 p-6 mb-6 transition-colors duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Texto de Suporte do Quiz</h3>
        <button
          type="button"
          onClick={handleGenerateSupportText}
          disabled={isGeneratingSupport || questions.length === 0}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
        >
          {isGeneratingSupport ? 'Gerando...' : 'Gerar com IA'}
        </button>
      </div>
      
      <div className="mb-4">
        <label htmlFor="supportText" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Texto de Suporte (opcional)
        </label>
        <textarea
          id="supportText"
          value={supportText}
          onChange={(e) => setSupportText(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
          placeholder="Escreva um texto de suporte para contextualizar o quiz. Este texto pode ser apresentado antes dos alunos começarem."
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Este texto pode conter dicas, informações adicionais ou contexto sobre as perguntas do quiz para ajudar os estudantes. 
          {questions.length > 0 && ' Clique em "Gerar com IA" para criar automaticamente com base nas perguntas existentes.'}
          {questions.length === 0 && ' Adicione perguntas primeiro para poder gerar texto de suporte com IA.'}
        </p>
      </div>
      
      {saveMessage && (
        <div className="mb-3 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-800 dark:text-green-300 transition-opacity duration-200">
          {saveMessage}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveSupportText}
          disabled={!supportText.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400"
        >
          Guardar texto de suporte
        </button>
      </div>
    </div>
  );
};

export default SupportTextForm;

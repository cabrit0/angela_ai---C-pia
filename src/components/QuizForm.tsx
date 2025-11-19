import React, { useState } from 'react';
import type { Quiz } from '../types';

interface QuizFormProps {
  initialData?: Partial<Quiz>;
  onSubmit: (
    data: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'questions' | 'supportText'> & {
      youtubeVideos?: string[];
    }
  ) => void;
  onCancel?: () => void;
}

const QuizForm: React.FC<QuizFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [grade, setGrade] = useState(initialData?.grade || '');
  const [youtubeVideos] = useState<string[]>(initialData?.youtubeVideos || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('O título do quiz é obrigatório');
      return;
    }

    onSubmit({
      title: title.trim(),
      subject: subject.trim(),
      grade: grade.trim(),
      youtubeVideos: youtubeVideos
        .map((u) => u.trim())
        .filter((u) => u.length > 0)
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 p-6 mb-6 transition-colors duration-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Informações do Quiz</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Título *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
            placeholder="Digite o título do quiz"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Disciplina
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
            placeholder="Ex: Matemática, História, etc."
          />
        </div>

        <div className="mb-6">
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Nível/Ano
          </label>
          <input
            type="text"
            id="grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
            placeholder="Ex: 1º Ano, 5º Ano, Ensino Médio, etc."
          />
        </div>

        {/* YouTube Videos (manual + suggestions, all free embeds) */}
        {/* Nota: configuração de vídeos foi movida para a secção de Perguntas/Revisão.
            A seleção de vídeos só deve ocorrer depois de o quiz ter perguntas/ contexto gerado. */}

        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:bg-transparent dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-colors duration-200"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400"
          >
            Salvar Quiz
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizForm;

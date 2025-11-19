/*  */import React, { useState } from 'react';
import type { Question } from '../types';
import QuestionForm from './QuestionForm';
import AiImagePanel from './AiImagePanel';

interface QuestionEditorProps {
  questions: Question[];
  onAddQuestion: (question: Omit<Question, 'id'>) => void;
  onEditQuestion: (questionId: string, question: Omit<Question, 'id'>) => void;
  onRemoveQuestion: (questionId: string) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  questions,
  onAddQuestion,
  onEditQuestion,
  onRemoveQuestion
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  const handleAddQuestion = (questionData: Omit<Question, 'id'>) => {
    onAddQuestion(questionData);
    setShowForm(false);
  };

  const handleEditQuestion = (questionData: Omit<Question, 'id'>) => {
    if (editingQuestion) {
      onEditQuestion(editingQuestion.id, questionData);
      setEditingQuestion(null);
    }
  };

  const startEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
  };

  const cancelAdd = () => {
    setShowForm(false);
  };

  const handleGenerateImage = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setShowImagePanel(true);
  };

  const handleImageGenerated = (imageUrl: string) => {
    if (selectedQuestionId) {
      const question = questions.find(q => q.id === selectedQuestionId);
      if (question) {
        onEditQuestion(selectedQuestionId, { ...question, imageUrl });
      }
    }
    setSelectedQuestionId(null);
  };

  const handleRemoveImage = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      onEditQuestion(questionId, { ...question, imageUrl: undefined });
    }
  };

  const closeImagePanel = () => {
    setShowImagePanel(false);
    setSelectedQuestionId(null);
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq':
        return 'Múltipla Escolha';
      case 'truefalse':
        return 'Verdadeiro/Falso';
      case 'short':
        return 'Resposta Curta';
      case 'gapfill':
        return 'Preencher Lacuna';
      case 'essay':
        return 'Resposta Discursiva';
      case 'matching':
        return 'Associação';
      case 'ordering':
        return 'Ordenação';
      default:
        return type;
    }
  };

  const getCorrectAnswer = (question: Question) => {
    if (question.type === 'short' || question.type === 'gapfill' || question.type === 'essay') {
      return question.answer;
    }

    if (question.type === 'matching') {
      if (question.matchingPairs && question.matchingPairs.length > 0) {
        return question.matchingPairs.map(pair => `${pair.leftItem} -> ${pair.rightItem}`).join(', ');
      }
      return 'Não definida';
    }

    if (question.type === 'ordering') {
      if (question.orderingItems && question.orderingItems.length > 0) {
        return question.orderingItems.join(' → ');
      }
      if (typeof question.answer === 'string') {
        return question.answer;
      }
      return 'Sem passos definidos';
    }

    if (question.choices) {
      const correctChoice = question.choices.find(choice => choice.correct);
      return correctChoice ? correctChoice.text : 'Não definida';
    }

    return 'Não definida';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Perguntas ({questions.length})</h2>
        {!showForm && !editingQuestion && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Adicionar Pergunta
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6">
          <QuestionForm
            onSubmit={handleAddQuestion}
            onCancel={cancelAdd}
            autoGenerateImage={true}
          />
        </div>
      )}

      {editingQuestion && (
        <div className="mb-6">
          <QuestionForm
            initialData={editingQuestion}
            onSubmit={handleEditQuestion}
            onCancel={cancelEdit}
            autoGenerateImage={false} // Don't auto-generate when editing existing questions
          />
        </div>
      )}

      {!showForm && !editingQuestion && (
        <>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Nenhuma pergunta adicionada ainda.</p>
              <p className="mt-2">Clique em "Adicionar Pergunta" para comeÃ§ar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 transition-colors duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          Pergunta {index + 1}:
                        </span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full transition-colors duration-200">
                          {getQuestionTypeLabel(question.type)}
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 mb-2 break-words">
                        {question.prompt}
                      </p>
                      {question.imageUrl && (
                        <div className="mb-2">
                          <div className="relative inline-block">
                            <img
                              src={question.imageUrl}
                              alt="Imagem da pergunta"
                              className="max-w-full sm:max-w-xs max-h-40 object-contain border border-gray-200 dark:border-gray-600 rounded transition-colors duration-200"
                              onLoad={() => {
                                console.log('Image loaded successfully:', question.imageUrl);
                              }}
                              onError={(e) => {
                                console.error('Error loading image:', question.imageUrl);
                                const imgElement = e.target as HTMLImageElement;
                                imgElement.style.display = 'none';

                                // Show error message
                                const errorDiv = document.createElement('div');
                                errorDiv.className =
                                  'text-red-500 text-sm p-2 border border-red-200 rounded bg-red-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
                                errorDiv.textContent = 'Erro ao carregar imagem';
                                imgElement.parentNode?.insertBefore(errorDiv, imgElement.nextSibling);
                              }}
                            />
                            <button
                              onClick={() => handleRemoveImage(question.id)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                              title="Remover imagem"
                              aria-label="Remover imagem"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Resposta correta:</span>{' '}
                        {getCorrectAnswer(question)}
                      </div>
                    </div>

                    {/* Action buttons - responsive, contained within card */}
                    <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end sm:ml-4">
                      <button
                        onClick={() => startEditQuestion(question)}
                        className="px-3 py-1 text-xs sm:text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors duration-200"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onRemoveQuestion(question.id)}
                        className="px-3 py-1 text-xs sm:text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                      >
                        Remover
                      </button>
                      <button
                        onClick={() => handleGenerateImage(question.id)}
                        className="px-3 py-1 text-xs sm:text-sm bg-purple-500 text-white rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                      >
                        {question.imageUrl ? 'Alterar Imagem' : 'Gerar Imagem'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showImagePanel && (
        <AiImagePanel
          onImageGenerated={handleImageGenerated}
          onClose={closeImagePanel}
        />
      )}
    </div>
  );
};

export default QuestionEditor;

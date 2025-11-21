import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicSharesApi, sharesApi } from '../lib/api';
import SecondaryNav from '../components/SecondaryNav';

const PublicQuizzes: React.FC = () => {
  const navigate = useNavigate();
  const [publicQuizzes, setPublicQuizzes] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'public' | 'my-requests'>('public');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [quizzes, requests] = await Promise.all([
        publicSharesApi.listPublicQuizzes(),
        publicSharesApi.getMyRequests(),
      ]);
      setPublicQuizzes(quizzes);
      setMyRequests(requests);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleForkQuiz = async (quizId: string) => {
    try {
      const forkedQuiz = await sharesApi.forkSharedQuiz(quizId);
      navigate(`/quiz/edit/${forkedQuiz.id}`);
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar fork do quiz');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Quizzes Públicos
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Quizzes compartilhados por outros professores
          </p>
        </div>

        {/* Secondary Navigation */}
        <SecondaryNav />

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('public')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === 'public'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              Quizzes Públicos
            </button>
            <button
              onClick={() => setActiveTab('my-requests')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === 'my-requests'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              Meus Pedidos
            </button>
          </nav>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">A carregar...</p>
          </div>
        ) : activeTab === 'public' ? (
          <div>
            {publicQuizzes.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum quiz público disponível
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {quiz.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {quiz.description || 'Sem descrição'}
                    </p>
                    <div className="mt-3 text-sm text-gray-500 dark:text-gray-500">
                      <p>
                        <span className="font-medium">Criado por:</span>{' '}
                        {quiz.ownerId?.name || 'Desconhecido'}
                      </p>
                      {quiz.questionCount !== undefined && (
                        <p>
                          <span className="font-medium">Perguntas:</span> {quiz.questionCount}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleForkQuiz(quiz.id)}
                      className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Criar Cópia
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {myRequests.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-gray-500 dark:text-gray-400">
                  Você ainda não fez nenhum pedido de compartilhamento público
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {request.quizId?.title || 'Quiz sem título'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {request.quizId?.description || 'Sem descrição'}
                        </p>
                        {request.requestMessage && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Mensagem:</span> {request.requestMessage}
                          </p>
                        )}
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                          Solicitado em: {new Date(request.createdAt).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span
                          className={`
                            inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                            ${
                              request.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : request.status === 'APPROVED'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }
                          `}
                        >
                          {request.status === 'PENDING' && 'Pendente'}
                          {request.status === 'APPROVED' && 'Aprovado'}
                          {request.status === 'REJECTED' && 'Rejeitado'}
                        </span>
                      </div>
                    </div>
                    {request.status === 'REJECTED' && request.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          <span className="font-medium">Motivo da rejeição:</span>{' '}
                          {request.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicQuizzes;


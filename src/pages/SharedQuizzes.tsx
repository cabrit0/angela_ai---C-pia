import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth/AuthContext';
import { sharesApi, getQuizzes, usersApi } from '../lib/api';
import SecondaryNav from '../components/SecondaryNav';
import type { ApiShare } from '../lib/api/httpClient';
import type { Quiz } from '../types/quiz';

interface SharedQuizSummary {
  shareId: string;
  quizId: string;
  title: string;
  description?: string | null;
  ownerId: string;
  canEdit: boolean;
}

const SharedQuizzesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect students away from this page
  if (user?.role === 'STUDENT') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Acesso Restrito</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Esta página está disponível apenas para professores e administradores.</p>
          <a href="/" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Voltar para Início</a>
        </div>
      </div>
    );
  }
  const [loading, setLoading] = useState(true);
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<SharedQuizSummary[]>([]);
  const [myShares, setMyShares] = useState<ApiShare[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShareForm, setShowShareForm] = useState(false);
  const [formData, setFormData] = useState({
    sharedWithTeacherEmail: '',
    canEdit: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'shared'>('received');
  const [teacherSearchResults, setTeacherSearchResults] = useState<any[]>([]);
  const [showTeacherSearch, setShowTeacherSearch] = useState(false);
  const [searchingTeachers, setSearchingTeachers] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [quizzesData, sharedWithData, sharesData] = await Promise.all([
        getQuizzes(),
        sharesApi.listSharedWithMe(),
        // Nota: Não existe um endpoint para listar meus compartilhamentos ainda
        // Por enquanto, vamos usar um array vazio
        Promise.resolve([] as ApiShare[]),
      ]);
      
      setMyQuizzes(quizzesData);
      setSharedWithMe(sharedWithData);
      setMyShares(sharesData);
    } catch (e: any) {
      setError(e?.message || 'Não foi possível carregar os quizzes compartilhados.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz || !formData.sharedWithTeacherEmail.trim()) {
      setFormError('Quiz e email do professor são obrigatórios.');
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.sharedWithTeacherEmail.trim())) {
      setFormError('Por favor, insira um email válido.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await sharesApi.shareQuizByEmail(selectedQuiz.id, formData.sharedWithTeacherEmail.trim(), formData.canEdit);
      
      // Recarregar dados
      const sharesData = await sharesApi.listSharesForQuiz(selectedQuiz.id);
      setMyShares(sharesData);
      
      setFormData({ sharedWithTeacherEmail: '', canEdit: false });
      setShowShareForm(false);
      setSelectedQuiz(null);
    } catch (e: any) {
      setFormError(e?.message || 'Não foi possível compartilhar o quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeShare = async (quizId: string, sharedWithTeacherId: string) => {
    if (!confirm('Tem certeza que deseja revogar o compartilhamento?')) {
      return;
    }

    try {
      await sharesApi.revokeShare(quizId, sharedWithTeacherId);
      
      // Recarregar dados
      const sharesData = await sharesApi.listSharesForQuiz(quizId);
      setMyShares(sharesData);
    } catch (e: any) {
      setError(e?.message || 'Não foi possível revogar o compartilhamento.');
    }
  };

  const handleForkQuiz = async (quizId: string) => {
    try {
      const forkedQuiz = await sharesApi.forkSharedQuiz(quizId);
      navigate(`/quiz/edit/${forkedQuiz.id}`);
    } catch (e: any) {
      setError(e?.message || 'Não foi possível criar o fork do quiz.');
    }
  };

  const openShareForm = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setFormData({ sharedWithTeacherEmail: '', canEdit: false });
    setShowShareForm(true);
    setFormError(null);
  };

  const loadQuizShares = async (quizId: string) => {
    try {
      const sharesData = await sharesApi.listSharesForQuiz(quizId);
      setMyShares(sharesData);
    } catch (e: any) {
      console.error('Erro ao carregar compartilhamentos:', e);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 mobile-safe-top mobile-safe-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Quizzes Compartilhados
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Compartilhe e receba quizzes de outros professores
            </p>
          </div>
        </div>

        {/* Secondary Navigation */}
        <SecondaryNav />

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
            <span className="text-gray-600 dark:text-gray-400">A carregar quizzes compartilhados...</span>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('received')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'received'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Recebidos
                </button>
                <button
                  onClick={() => setActiveTab('shared')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'shared'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Meus Compartilhamentos
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Received Quizzes Tab */}
              {activeTab === 'received' && (
                <div>
                  {sharedWithMe.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0021 12c0-4.474-3.12-8.268-7.316-9.032m0 0A9.001 9.001 0 0112 21c4.474 0 8.268-3.12 9.032-7.326" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Nenhum quiz recebido
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Quando outros professores compartilharem quizzes com você, eles aparecerão aqui
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sharedWithMe.map((quiz) => (
                        <div
                          key={quiz.shareId}
                          className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                              {quiz.title}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              quiz.canEdit
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}>
                              {quiz.canEdit ? 'Pode editar' : 'Apenas leitura'}
                            </span>
                          </div>
                          {quiz.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {quiz.description}
                            </p>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Owner: {quiz.ownerId}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleForkQuiz(quiz.quizId)}
                              className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Fazer Fork
                            </button>
                            <Link
                              to={`/quiz/${quiz.quizId}`}
                              className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 border border-primary-600 dark:border-primary-400 text-sm font-medium rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-center"
                            >
                              Ver Quiz
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* My Shares Tab */}
              {activeTab === 'shared' && (
                <div>
                  {myQuizzes.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707H19a2 2 0 002-2v-4a1 1 0 00-1-1h-1z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Nenhum quiz para compartilhar
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Crie quizzes primeiro para poder compartilhá-los
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myQuizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {quiz.title}
                              </h3>
                              {quiz.subject && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {quiz.subject}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                openShareForm(quiz);
                                loadQuizShares(quiz.id);
                              }}
                              className="ml-4 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0021 12c0-4.474-3.12-8.268-7.316-9.032m0 0A9.001 9.001 0 0112 21c4.474 0 8.268-3.12 9.032-7.326" />
                              </svg>
                              Compartilhar
                            </button>
                          </div>
                          
                          {/* Shares List */}
                          {myShares.filter(s => s.quizId === quiz.id).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Compartilhamentos ativos:
                              </h4>
                              <div className="space-y-2">
                                {myShares
                                  .filter(s => s.quizId === quiz.id)
                                  .map((share) => (
                                    <div
                                      key={share.id}
                                      className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded"
                                    >
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">Professor:</span> {share.sharedWithTeacherId}
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                          {share.canEdit ? 'Pode editar' : 'Apenas leitura'}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleRevokeShare(share.quizId, share.sharedWithTeacherId)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm"
                                      >
                                        Revogar
                                      </button>
                                    </div>
                                  ))}
                              </div>
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
        )}

        {/* Share Quiz Modal */}
        {showShareForm && selectedQuiz && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Compartilhar Quiz: {selectedQuiz.title}
                </h3>
                <button
                  onClick={() => {
                    setShowShareForm(false);
                    setFormError(null);
                    setSelectedQuiz(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleShareQuiz}>
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {formError}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email do Professor Destinatário
                  </label>
                  <input
                    type="email"
                    value={formData.sharedWithTeacherEmail}
                    onChange={(e) => setFormData({ ...formData, sharedWithTeacherEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="email@exemplo.com"
                    required
                  />
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Simular busca de professores - em uma implementação real, isso chamaria uma API
                        alert('Funcionalidade de busca de professores será implementada com a integração da base de dados.')
                      }}
                      className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Buscar professores disponíveis
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Digite o email do professor que deseja compartilhar o quiz
                  </p>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!formData.sharedWithTeacherEmail.trim()) {
                          setFormError('Digite um email para buscar professores');
                          return;
                        }
                        
                        setSearchingTeachers(true);
                        setFormError(null);
                        try {
                          const results = await usersApi.searchTeachersByEmail(formData.sharedWithTeacherEmail.trim());
                          setTeacherSearchResults(results);
                          setShowTeacherSearch(true);
                        } catch (e: any) {
                          setFormError(e?.message || 'Erro ao buscar professores');
                        } finally {
                          setSearchingTeachers(false);
                        }
                      }}
                      disabled={searchingTeachers}
                      className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50"
                    >
                      {searchingTeachers ? 'Buscando...' : 'Buscar professores'}
                    </button>
                  </div>
                  
                  {/* Teacher Search Results */}
                  {showTeacherSearch && (
                    <div className="mt-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md max-h-32 overflow-y-auto">
                      {teacherSearchResults.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nenhum professor encontrado com este email
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {teacherSearchResults.map((teacher) => (
                            <button
                              key={teacher.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, sharedWithTeacherEmail: teacher.email });
                                setShowTeacherSearch(false);
                                setTeacherSearchResults([]);
                              }}
                              className="w-full text-left p-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                            >
                              <div className="font-medium text-gray-900 dark:text-white">{teacher.name}</div>
                              <div className="text-gray-500 dark:text-gray-400">{teacher.email}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowTeacherSearch(false);
                          setTeacherSearchResults([]);
                        }}
                        className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Fechar busca
                      </button>
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.canEdit}
                      onChange={(e) => setFormData({ ...formData, canEdit: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Permitir edição do quiz
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Se marcado, o professor destinatário poderá editar o quiz
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareForm(false);
                      setFormError(null);
                      setSelectedQuiz(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'A compartilhar...' : 'Compartilhar Quiz'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedQuizzesPage;
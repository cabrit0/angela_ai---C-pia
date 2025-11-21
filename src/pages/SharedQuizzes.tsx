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
    searchQuery: '',
    canEdit: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'shared'>('received');
  const [teacherSearchResults, setTeacherSearchResults] = useState<any[]>([]);
  const [showTeacherSearch, setShowTeacherSearch] = useState(false);
  const [searchingTeachers, setSearchingTeachers] = useState(false);
  const [selectedTeacherEmails, setSelectedTeacherEmails] = useState<Set<string>>(new Set());
  const [sharingProgress, setSharingProgress] = useState<{ current: number; total: number } | null>(null);

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
    if (!selectedQuiz) {
      setFormError('Selecione um quiz para compartilhar.');
      return;
    }

    if (selectedTeacherEmails.size === 0) {
      setFormError('Selecione pelo menos um professor para compartilhar.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setSharingProgress({ current: 0, total: selectedTeacherEmails.size });

    const errors: string[] = [];
    let successCount = 0;

    try {
      const emailsArray = Array.from(selectedTeacherEmails);

      for (let i = 0; i < emailsArray.length; i++) {
        const email = emailsArray[i];
        try {
          await sharesApi.shareQuizByEmail(selectedQuiz.id, email, formData.canEdit);
          successCount++;
        } catch (e: any) {
          errors.push(`${email}: ${e?.message || 'Erro desconhecido'}`);
        }
        setSharingProgress({ current: i + 1, total: emailsArray.length });
      }

      // Recarregar dados
      const sharesData = await sharesApi.listSharesForQuiz(selectedQuiz.id);
      setMyShares(sharesData);

      // Mostrar resultado
      if (errors.length === 0) {
        setFormError(null);
        alert(`Quiz compartilhado com sucesso com ${successCount} professor(es)!`);
      } else {
        setFormError(`Compartilhado com ${successCount} professor(es). Erros:\n${errors.join('\n')}`);
      }

      // Limpar seleção se tudo correu bem
      if (errors.length === 0) {
        setFormData({ searchQuery: '', canEdit: false });
        setSelectedTeacherEmails(new Set());
        setTeacherSearchResults([]);
        setShowTeacherSearch(false);
        setShowShareForm(false);
        setSelectedQuiz(null);
      }
    } catch (e: any) {
      setFormError(e?.message || 'Não foi possível compartilhar o quiz.');
    } finally {
      setIsSubmitting(false);
      setSharingProgress(null);
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
    setFormData({ searchQuery: '', canEdit: false });
    setSelectedTeacherEmails(new Set());
    setTeacherSearchResults([]);
    setShowTeacherSearch(false);
    setShowShareForm(true);
    setFormError(null);
  };

  const handleSearchTeachers = async () => {
    const query = formData.searchQuery.trim();
    if (!query) {
      setFormError('Digite um termo de busca (nome ou email)');
      return;
    }

    setSearchingTeachers(true);
    setFormError(null);
    try {
      const results = await usersApi.searchTeachersByEmail(query);
      setTeacherSearchResults(results);
      setShowTeacherSearch(true);
    } catch (e: any) {
      setFormError(e?.message || 'Erro ao buscar professores');
    } finally {
      setSearchingTeachers(false);
    }
  };

  const handleSearchAllTeachers = async () => {
    setSearchingTeachers(true);
    setFormError(null);
    try {
      // Buscar com string vazia para retornar todos os professores
      const results = await usersApi.searchTeachersByEmail('');
      setTeacherSearchResults(results);
      setShowTeacherSearch(true);
      setFormData({ ...formData, searchQuery: '' });
    } catch (e: any) {
      setFormError(e?.message || 'Erro ao buscar professores');
    } finally {
      setSearchingTeachers(false);
    }
  };

  const handleToggleTeacher = (email: string) => {
    const newSelected = new Set(selectedTeacherEmails);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedTeacherEmails(newSelected);
  };

  const handleSelectAllTeachers = () => {
    const allEmails = new Set(teacherSearchResults.map(t => t.email));
    setSelectedTeacherEmails(allEmails);
  };

  const handleDeselectAllTeachers = () => {
    setSelectedTeacherEmails(new Set());
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
                    Buscar Professores
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.searchQuery}
                      onChange={(e) => setFormData({ ...formData, searchQuery: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchTeachers();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Digite nome ou email..."
                    />
                    <button
                      type="button"
                      onClick={handleSearchTeachers}
                      disabled={searchingTeachers}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {searchingTeachers ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleSearchAllTeachers}
                      disabled={searchingTeachers}
                      className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50"
                    >
                      Buscar Todos os Professores
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Busque professores por nome ou email, ou clique em "Buscar Todos" para ver todos os professores disponíveis
                  </p>

                  {/* Teacher Search Results */}
                  {showTeacherSearch && (
                    <div className="mt-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md">
                      {teacherSearchResults.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nenhum professor encontrado
                        </p>
                      ) : (
                        <>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {teacherSearchResults.length} professor(es) encontrado(s)
                              {selectedTeacherEmails.size > 0 && ` - ${selectedTeacherEmails.size} selecionado(s)`}
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleSelectAllTeachers}
                                className="text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                              >
                                Selecionar Todos
                              </button>
                              <button
                                type="button"
                                onClick={handleDeselectAllTeachers}
                                className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                Limpar Seleção
                              </button>
                            </div>
                          </div>
                          <div className="max-h-64 overflow-y-auto space-y-1">
                            {teacherSearchResults.map((teacher) => (
                              <label
                                key={teacher.id}
                                className="flex items-start p-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedTeacherEmails.has(teacher.email)}
                                  onChange={() => handleToggleTeacher(teacher.email)}
                                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <div className="ml-2 flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white">{teacher.name}</div>
                                  <div className="text-gray-500 dark:text-gray-400">{teacher.email}</div>
                                  {teacher.role === 'ADMIN' && (
                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
                                      Administrador
                                    </span>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowTeacherSearch(false);
                            }}
                            className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            Fechar lista
                          </button>
                        </>
                      )}
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
                    Se marcado, os professores selecionados poderão editar o quiz
                  </p>
                </div>

                {/* Sharing Progress */}
                {sharingProgress && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Compartilhando...
                      </span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {sharingProgress.current} de {sharingProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(sharingProgress.current / sharingProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Selected Teachers Summary */}
                {selectedTeacherEmails.size > 0 && !sharingProgress && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-sm text-green-900 dark:text-green-100">
                      <strong>{selectedTeacherEmails.size}</strong> professor(es) selecionado(s) para compartilhamento
                    </p>
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareForm(false);
                      setFormError(null);
                      setSelectedQuiz(null);
                      setSelectedTeacherEmails(new Set());
                      setTeacherSearchResults([]);
                      setShowTeacherSearch(false);
                    }}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedTeacherEmails.size === 0}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting
                      ? 'A compartilhar...'
                      : selectedTeacherEmails.size > 0
                        ? `Compartilhar com ${selectedTeacherEmails.size} Professor(es)`
                        : 'Compartilhar Quiz'
                    }
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
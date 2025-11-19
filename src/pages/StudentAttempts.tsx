import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import { statisticsApi, getQuizzes } from '../lib/api';
import type { StudentAttempt } from '../lib/api/httpClient';
import type { Quiz } from '../types/quiz';

const StudentAttemptsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedQuiz) {
      loadAttempts();
    }
  }, [selectedQuiz]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const quizzesData = await getQuizzes();
      setQuizzes(quizzesData);
    } catch (e: any) {
      setError(e?.message || 'Não foi possível carregar os quizzes.');
    } finally {
      setLoading(false);
    }
  };

  const loadAttempts = async () => {
    if (!selectedQuiz) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Se for professor, carrega todos os attempts do quiz
      if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
        const attemptsData = await statisticsApi.getQuizAttempts(selectedQuiz);
        setAttempts(attemptsData);
      } else {
        // Se for aluno, carrega apenas os attempts do próprio aluno
        const attemptsData = await statisticsApi.getStudentAttempts(user!.id, selectedQuiz);
        setAttempts(attemptsData);
      }
    } catch (e: any) {
      setError(e?.message || 'Não foi possível carregar as tentativas.');
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'Submetido';
      case 'IN_PROGRESS':
        return 'Em Progresso';
      default:
        return status;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 mobile-safe-top mobile-safe-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {isTeacher ? 'Tentativas dos Alunos' : 'Minhas Tentativas'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isTeacher 
                ? 'Visualize todas as tentativas dos alunos nos quizzes'
                : 'Visualize seu histórico de tentativas nos quizzes'
              }
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Quiz Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecione um Quiz
            </label>
            <select
              value={selectedQuiz}
              onChange={(e) => setSelectedQuiz(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecione um quiz para ver as tentativas</option>
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
            <span className="text-gray-600 dark:text-gray-400">A carregar tentativas...</span>
          </div>
        )}

        {/* Content */}
        {!loading && selectedQuiz && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {attempts.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002 2m-3 7a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma tentativa encontrada para este quiz
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {isTeacher 
                    ? 'Nenhum aluno realizou este quiz ainda'
                    : 'Você ainda não realizou este quiz'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {isTeacher ? 'Aluno' : 'Quiz'}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Pontuação
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tempo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Início
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Submissão
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {attempts.map((attempt) => (
                      <tr key={attempt.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {isTeacher ? (attempt.studentName || 'Aluno Desconhecido') : (attempt.quizTitle || 'Quiz Desconhecido')}
                            </div>
                            {isTeacher && attempt.studentName && (
                              <div className="text-gray-500 dark:text-gray-400 text-xs">
                                {attempt.studentId}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className={`font-medium ${getScoreColor(attempt.percentage)}`}>
                              {attempt.score}/{attempt.maxScore} ({attempt.percentage.toFixed(1)}%)
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                              <div
                                className={`h-2 rounded-full ${
                                  attempt.percentage >= 80
                                    ? 'bg-green-500'
                                    : attempt.percentage >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${attempt.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(attempt.status)}`}>
                            {getStatusText(attempt.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatTime(attempt.timeSpentMinutes)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(attempt.startedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {attempt.submittedAt ? formatDate(attempt.submittedAt) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Statistics Summary */}
        {!loading && selectedQuiz && attempts.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Estatísticas do Quiz
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {attempts.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total de Tentativas
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {attempts.filter(a => a.status === 'SUBMITTED').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Submetidas
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Pontuação Média
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatTime(Math.round(attempts.reduce((sum, a) => sum + a.timeSpentMinutes, 0) / attempts.length))}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Tempo Médio
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttemptsPage;
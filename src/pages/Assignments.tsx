import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import { assignmentsApi, classesApi, getQuizzes, usersApi } from '../lib/api';
import SecondaryNav from '../components/SecondaryNav';
import type { ApiAssignment, ApiClass } from '../lib/api/httpClient';
import type { Quiz } from '../types/quiz';

const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  
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
  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);
  const [classes, setClasses] = useState<ApiClass[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ApiAssignment | null>(null);
  const [formData, setFormData] = useState({
    quizId: '',
    classId: '',
    studentId: '',
    availableFrom: '',
    availableTo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [searchingStudents, setSearchingStudents] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [assignmentsData, classesData, quizzesData] = await Promise.all([
        assignmentsApi.listForCurrentUser(),
        classesApi.listForCurrentUser(),
        getQuizzes(),
      ]);
      
      setAssignments(assignmentsData);
      setClasses(classesData);
      setQuizzes(quizzesData);
    } catch (e: any) {
      setError(e?.message || 'Não foi possível carregar os assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.quizId || (!formData.classId && !formData.studentId)) {
      setFormError('Quiz e turma ou aluno são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const newAssignment = await assignmentsApi.create({
        quizId: formData.quizId,
        classId: formData.classId || undefined,
        studentId: formData.studentId || undefined,
        availableFrom: formData.availableFrom || undefined,
        availableTo: formData.availableTo || undefined,
      });
      setAssignments([newAssignment, ...assignments]);
      setFormData({
        quizId: '',
        classId: '',
        studentId: '',
        availableFrom: '',
        availableTo: '',
      });
      setShowCreateForm(false);
    } catch (e: any) {
      setFormError(e?.message || 'Não foi possível criar o assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const updatedAssignment = await assignmentsApi.update(selectedAssignment.id, {
        availableFrom: formData.availableFrom || null,
        availableTo: formData.availableTo || null,
        isActive: selectedAssignment.isActive,
      });
      setAssignments(assignments.map(a => a.id === selectedAssignment.id ? updatedAssignment : a));
      setFormData({
        quizId: '',
        classId: '',
        studentId: '',
        availableFrom: '',
        availableTo: '',
      });
      setShowEditForm(false);
      setSelectedAssignment(null);
    } catch (e: any) {
      setFormError(e?.message || 'Não foi possível atualizar o assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este assignment? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await assignmentsApi.remove(assignmentId);
      setAssignments(assignments.filter(a => a.id !== assignmentId));
    } catch (e: any) {
      setError(e?.message || 'Não foi possível excluir o assignment.');
    }
  };

  const handleToggleActive = async (assignment: ApiAssignment) => {
    try {
      const updatedAssignment = await assignmentsApi.update(assignment.id, {
        isActive: !assignment.isActive,
      });
      setAssignments(assignments.map(a => a.id === assignment.id ? updatedAssignment : a));
    } catch (e: any) {
      setError(e?.message || 'Não foi possível alterar o status do assignment.');
    }
  };

  const openEditForm = (assignment: ApiAssignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      quizId: assignment.quizId,
      classId: assignment.classId || '',
      studentId: assignment.studentId || '',
      availableFrom: assignment.availableFrom || '',
      availableTo: assignment.availableTo || '',
    });
    setShowEditForm(true);
    setFormError(null);
  };

  const getQuizTitle = (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId);
    return quiz ? quiz.title : quizId;
  };

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : classId;
  };

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 mobile-safe-top mobile-safe-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Gestão de Assignments
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Atribua quizzes a turmas e alunos
            </p>
          </div>
          {isTeacher && (
            <button
              onClick={() => {
                setFormData({
                  quizId: '',
                  classId: '',
                  studentId: '',
                  availableFrom: '',
                  availableTo: '',
                });
                setShowCreateForm(true);
                setFormError(null);
              }}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold shadow-sm hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Assignment
            </button>
          )}
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
            <span className="text-gray-600 dark:text-gray-400">A carregar assignments...</span>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {assignments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Nenhum assignment encontrado
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Crie seu primeiro assignment para começar
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Quiz
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Destinatário
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Período de Disponibilidade
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getQuizTitle(assignment.quizId)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {assignment.classId ? (
                              <span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mr-1">
                                  Turma
                                </span>
                                {getClassName(assignment.classId)}
                              </span>
                            ) : assignment.studentId ? (
                              <span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 mr-1">
                                  Aluno
                                </span>
                                {assignment.studentId.includes('@') ? assignment.studentId : `ID: ${assignment.studentId}`}
                              </span>
                            ) : (
                              <span className="text-gray-400">Não definido</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {assignment.availableFrom && (
                              <div>De: {new Date(assignment.availableFrom).toLocaleDateString()}</div>
                            )}
                            {assignment.availableTo && (
                              <div>Até: {new Date(assignment.availableTo).toLocaleDateString()}</div>
                            )}
                            {!assignment.availableFrom && !assignment.availableTo && (
                              <div className="text-gray-400">Sem restrição</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            assignment.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                            {assignment.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleToggleActive(assignment)}
                              className={`${
                                assignment.isActive
                                  ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300'
                                  : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                              }`}
                              title={assignment.isActive ? 'Desativar' : 'Ativar'}
                            >
                              {assignment.isActive ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => openEditForm(assignment)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Excluir"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Create Assignment Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Criar Novo Assignment
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateAssignment}>
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {formError}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quiz *
                  </label>
                  <select
                    value={formData.quizId}
                    onChange={(e) => setFormData({ ...formData, quizId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Selecione um quiz</option>
                    {quizzes.map((quiz) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Destinatário *
                  </label>
                  <div className="space-y-2">
                    <select
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value, studentId: '' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Selecione uma turma (opcional)</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="px-3 py-1 bg-white dark:bg-gray-800 text-xs text-gray-500">OU</span>
                      </div>
                      <input
                        type="email"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value, classId: '' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Email do aluno (opcional)"
                      />
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!formData.studentId.trim()) {
                              setFormError('Digite um email para buscar alunos');
                              return;
                            }
                            
                            setSearchingStudents(true);
                            setFormError(null);
                            try {
                              const results = await usersApi.searchStudentsByEmail(formData.studentId.trim());
                              setStudentSearchResults(results);
                              setShowStudentSearch(true);
                            } catch (e: any) {
                              setFormError(e?.message || 'Erro ao buscar alunos');
                            } finally {
                              setSearchingStudents(false);
                            }
                          }}
                          disabled={searchingStudents}
                          className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50"
                        >
                          {searchingStudents ? 'Buscando...' : 'Buscar alunos'}
                        </button>
                      </div>
                      
                      {/* Student Search Results */}
                      {showStudentSearch && (
                        <div className="mt-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md max-h-32 overflow-y-auto">
                          {studentSearchResults.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Nenhum aluno encontrado com este email
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {studentSearchResults.map((student) => (
                                <button
                                  key={student.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, studentId: student.email });
                                    setShowStudentSearch(false);
                                    setStudentSearchResults([]);
                                  }}
                                  className="w-full text-left p-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                                >
                                  <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                                  <div className="text-gray-500 dark:text-gray-400">{student.email}</div>
                                </button>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setShowStudentSearch(false);
                              setStudentSearchResults([]);
                            }}
                            className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            Fechar busca
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Disponível de (opcional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.availableFrom}
                      onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Disponível até (opcional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.availableTo}
                      onChange={(e) => setFormData({ ...formData, availableTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormError(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'A criar...' : 'Criar Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Assignment Modal */}
        {showEditForm && selectedAssignment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Editar Assignment
                </h3>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setFormError(null);
                    setSelectedAssignment(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleUpdateAssignment}>
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {formError}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quiz
                  </label>
                  <input
                    type="text"
                    value={getQuizTitle(selectedAssignment.quizId)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Destinatário
                  </label>
                  <input
                    type="text"
                    value={
                      selectedAssignment.classId
                        ? `Turma: ${getClassName(selectedAssignment.classId)}`
                        : selectedAssignment.studentId
                        ? `Aluno: ${selectedAssignment.studentId.includes('@') ? selectedAssignment.studentId : `ID: ${selectedAssignment.studentId}`}`
                        : 'Não definido'
                    }
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Disponível de
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.availableFrom}
                      onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Disponível até
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.availableTo}
                      onChange={(e) => setFormData({ ...formData, availableTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setFormError(null);
                      setSelectedAssignment(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'A atualizar...' : 'Atualizar Assignment'}
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

export default AssignmentsPage;
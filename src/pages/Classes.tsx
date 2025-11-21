import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import { classesApi, usersApi } from '../lib/api';
import SecondaryNav from '../components/SecondaryNav';
import type { ApiClass } from '../lib/api/httpClient';

interface Student {
  id: string;
  name: string;
  email: string;
  role?: 'STUDENT';
  enrolledAt?: string;
}

const ClassesPage: React.FC = () => {
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
  const [classes, setClasses] = useState<ApiClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<ApiClass | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [enrollData, setEnrollData] = useState({
    searchQuery: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudentEmails, setSelectedStudentEmails] = useState<Set<string>>(new Set());
  const [enrollingProgress, setEnrollingProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await classesApi.listForCurrentUser();
      setClasses(data);
    } catch (e: any) {
      setError(e?.message || 'Não foi possível carregar as turmas.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId: string) => {
    try {
      setLoadingStudents(true);
      const data = await classesApi.getStudents(classId);
      // Mapear os dados para garantir compatibilidade com a interface Student
      const mappedData = data.map(student => ({
        ...student,
        role: 'STUDENT' as const
      }));
      setStudents(mappedData);
    } catch (e: any) {
      console.error('Erro ao carregar alunos:', e);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('O nome da turma é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const newClass = await classesApi.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      setClasses([newClass, ...classes]);
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
    } catch (e: any) {
      setFormError(e?.message || 'Não foi possível criar a turma.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !formData.name.trim()) {
      setFormError('O nome da turma é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const updatedClass = await classesApi.update(selectedClass.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      setClasses(classes.map(c => c.id === selectedClass.id ? updatedClass : c));
      setFormData({ name: '', description: '' });
      setShowEditForm(false);
      setSelectedClass(null);
    } catch (e: any) {
      setFormError(e?.message || 'Não foi possível atualizar a turma.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await classesApi.remove(classId);
      setClasses(classes.filter(c => c.id !== classId));
      if (selectedClass?.id === classId) {
        setSelectedClass(null);
        setStudents([]);
      }
    } catch (e: any) {
      setError(e?.message || 'Não foi possível excluir a turma.');
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) {
      setFormError('Selecione uma turma.');
      return;
    }

    if (selectedStudentEmails.size === 0) {
      setFormError('Selecione pelo menos um aluno.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const emailsArray = Array.from(selectedStudentEmails);
      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < emailsArray.length; i++) {
        const email = emailsArray[i];
        try {
          await classesApi.enrollStudentByEmail(selectedClass.id, email);
          successCount++;
        } catch (e: any) {
          errors.push(`${email}: ${e?.message || 'Erro desconhecido'}`);
        }
        setEnrollingProgress({ current: i + 1, total: emailsArray.length });
      }

      setEnrollingProgress(null);
      setEnrollData({ searchQuery: '' });
      setSelectedStudentEmails(new Set());
      setShowStudentSearch(false);
      setStudentSearchResults([]);
      setShowEnrollForm(false);

      // Recarregar alunos da turma
      await loadStudents(selectedClass.id);

      if (errors.length > 0) {
        setFormError(`${successCount} aluno(s) inscrito(s) com sucesso. Erros: ${errors.join('; ')}`);
      } else {
        // Success message will be shown by reloading students
      }
    } catch (e: any) {
      setFormError(e?.message || 'Não foi possível inscrever os alunos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchStudents = async () => {
    if (!enrollData.searchQuery.trim()) {
      setFormError('Digite um termo para buscar alunos');
      return;
    }

    setSearchingStudents(true);
    setFormError(null);
    try {
      const results = await usersApi.searchStudentsByEmail(enrollData.searchQuery.trim());
      setStudentSearchResults(results);
      setShowStudentSearch(true);
    } catch (e: any) {
      setFormError(e?.message || 'Erro ao buscar alunos');
    } finally {
      setSearchingStudents(false);
    }
  };

  const handleSearchAllStudents = async () => {
    setSearchingStudents(true);
    setFormError(null);
    try {
      // Buscar com string vazia para retornar todos os alunos
      const results = await usersApi.searchStudentsByEmail('');
      setStudentSearchResults(results);
      setShowStudentSearch(true);
      setEnrollData({ ...enrollData, searchQuery: '' });
    } catch (e: any) {
      setFormError(e?.message || 'Erro ao buscar alunos');
    } finally {
      setSearchingStudents(false);
    }
  };

  const handleToggleStudent = (email: string) => {
    const newSelected = new Set(selectedStudentEmails);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedStudentEmails(newSelected);
  };

  const handleSelectAllStudents = () => {
    const allEmails = new Set(studentSearchResults.map(s => s.email));
    setSelectedStudentEmails(allEmails);
  };

  const handleDeselectAllStudents = () => {
    setSelectedStudentEmails(new Set());
  };

  const openEditForm = (classItem: ApiClass) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      description: classItem.description || '',
    });
    setShowEditForm(true);
    setFormError(null);
  };

  const openEnrollForm = (classItem: ApiClass) => {
    setSelectedClass(classItem);
    setEnrollData({ searchQuery: '' });
    setShowEnrollForm(true);
    setFormError(null);
  };

  const selectClass = async (classItem: ApiClass) => {
    setSelectedClass(classItem);
    await loadStudents(classItem.id);
  };

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 mobile-safe-top mobile-safe-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Gestão de Turmas
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Crie e gerencie as suas turmas e alunos
            </p>
          </div>
          {isTeacher && (
            <button
              onClick={() => {
                setFormData({ name: '', description: '' });
                setShowCreateForm(true);
                setFormError(null);
              }}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold shadow-sm hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova Turma
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
            <span className="text-gray-600 dark:text-gray-400">A carregar turmas...</span>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Classes List */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Suas Turmas
                </h2>
                {classes.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Ainda não tem turmas
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Crie sua primeira turma para começar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {classes.map((classItem) => (
                      <div
                        key={classItem.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedClass?.id === classItem.id
                            ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800'
                            : 'bg-white border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                        onClick={() => selectClass(classItem)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {classItem.name}
                            </h3>
                            {classItem.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                {classItem.description}
                              </p>
                            )}
                          </div>
                          {isTeacher && (
                            <div className="flex space-x-1 ml-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditForm(classItem);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded"
                                title="Editar turma"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClass(classItem.id);
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded"
                                title="Excluir turma"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Class Details */}
            <div className="lg:col-span-2">
              {selectedClass ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedClass.name}
                      </h2>
                      {selectedClass.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {selectedClass.description}
                        </p>
                      )}
                    </div>
                    {isTeacher && (
                      <button
                        onClick={() => openEnrollForm(selectedClass)}
                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-all"
                      >
                        <svg className="w-4 h-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Inscrever Aluno
                      </button>
                    )}
                  </div>

                  {/* Students List */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Alunos Inscritos
                    </h3>
                    {loadingStudents ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-2"></div>
                        <span className="text-gray-600 dark:text-gray-400">A carregar alunos...</span>
                      </div>
                    ) : students.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Nenhum aluno inscrito nesta turma
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Use o botão "Inscrever Aluno" para adicionar alunos
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Nome
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Email
                              </th>
                              <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Ações</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {students.map((student) => (
                              <tr key={student.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                  {student.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {student.email}
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
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                    Selecione uma turma
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Escolha uma turma da lista para ver detalhes e gerenciar alunos
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Class Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Criar Nova Turma
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
              <form onSubmit={handleCreateClass}>
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {formError}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Turma
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: Matemática 7ºA"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Notas internas sobre a turma"
                  />
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
                    {isSubmitting ? 'A criar...' : 'Criar Turma'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Class Modal */}
        {showEditForm && selectedClass && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Editar Turma
                </h3>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setFormError(null);
                    setSelectedClass(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleUpdateClass}>
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {formError}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Turma
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: Matemática 7ºA"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Notas internas sobre a turma"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setFormError(null);
                      setSelectedClass(null);
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
                    {isSubmitting ? 'A atualizar...' : 'Atualizar Turma'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Enroll Student Modal */}
        {showEnrollForm && selectedClass && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Inscrever Aluno em {selectedClass.name}
                </h3>
                <button
                  onClick={() => {
                    setShowEnrollForm(false);
                    setFormError(null);
                    setSelectedClass(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleEnrollStudent}>
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {formError}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buscar Alunos
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={enrollData.searchQuery}
                      onChange={(e) => setEnrollData({ ...enrollData, searchQuery: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchStudents();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Nome ou email do aluno"
                    />
                    <button
                      type="button"
                      onClick={handleSearchStudents}
                      disabled={searchingStudents}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {searchingStudents ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleSearchAllStudents}
                      disabled={searchingStudents}
                      className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50"
                    >
                      {searchingStudents ? 'Buscando...' : 'Buscar Todos os Alunos'}
                    </button>
                  </div>

                  {/* Student Search Results */}
                  {showStudentSearch && (
                    <div className="mt-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md">
                      {studentSearchResults.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nenhum aluno encontrado
                        </p>
                      ) : (
                        <>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {studentSearchResults.length} aluno(s) encontrado(s)
                              {selectedStudentEmails.size > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                                  {selectedStudentEmails.size} selecionado(s)
                                </span>
                              )}
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleSelectAllStudents}
                                className="text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400"
                              >
                                Selecionar Todos
                              </button>
                              <button
                                type="button"
                                onClick={handleDeselectAllStudents}
                                className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400"
                              >
                                Limpar Seleção
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {studentSearchResults.map((student) => (
                              <label
                                key={student.id}
                                className="flex items-center p-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedStudentEmails.has(student.email)}
                                  onChange={() => handleToggleStudent(student.email)}
                                  className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                                  <div className="text-gray-500 dark:text-gray-400 text-xs">{student.email}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Enrolling Progress */}
                  {enrollingProgress && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-800 dark:text-blue-200">
                          A inscrever alunos...
                        </span>
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          {enrollingProgress.current} de {enrollingProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(enrollingProgress.current / enrollingProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEnrollForm(false);
                      setFormError(null);
                      setSelectedClass(null);
                      setSelectedStudentEmails(new Set());
                      setShowStudentSearch(false);
                      setStudentSearchResults([]);
                      setEnrollData({ searchQuery: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedStudentEmails.size === 0}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {isSubmitting
                      ? 'A inscrever...'
                      : `Inscrever ${selectedStudentEmails.size} Aluno(s)`}
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

export default ClassesPage;
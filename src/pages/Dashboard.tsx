import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth/AuthContext';
import { classesApi, assignmentsApi, sharesApi, publicSharesApi } from '../lib/api';
import SecondaryNav from '../components/SecondaryNav';

interface ClassSummary {
  id: string;
  name: string;
  description?: string | null;
  teacherId: string;
}

interface AssignmentSummary {
  id: string;
  quizId: string;
  classId?: string | null;
  studentId?: string | null;
  isActive: boolean;
  availableFrom?: string | null;
  availableTo?: string | null;
}

interface SharedQuizSummary {
  shareId: string;
  quizId: string;
  title: string;
  description?: string | null;
  ownerId: string;
  canEdit: boolean;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, status } = useAuth();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<SharedQuizSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreateClassForm, setShowCreateClassForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [classFormError, setClassFormError] = useState<string | null>(null);
  const [pendingPublicSharesCount, setPendingPublicSharesCount] = useState(0);

  useEffect(() => {
    if (status === 'checking' || status === 'idle') return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Classes visible to current user
        const [cls, asg] = await Promise.all([
          classesApi.listForCurrentUser().catch(() => []),
          assignmentsApi.listForCurrentUser().catch(() => []),
        ]);

        if (cancelled) return;

        setClasses(cls || []);
        setAssignments(asg || []);

        // Shared quizzes for TEACHER
        if (user && user.role === 'TEACHER') {
          const shared = await sharesApi
            .listSharedWithMe()
            .catch(() => [] as SharedQuizSummary[]);
          if (!cancelled) {
            setSharedWithMe(shared || []);
          }
        } else {
          setSharedWithMe([]);
        }

        // Pending public share requests for ADMIN
        if (user && user.role === 'ADMIN') {
          try {
            const pendingRequests = await publicSharesApi.listAllRequests('PENDING');
            if (!cancelled) {
              setPendingPublicSharesCount(pendingRequests?.length || 0);
            }
          } catch (err) {
            console.error('[Dashboard] Erro ao carregar pedidos pendentes:', err);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.message ||
              'Não foi possível carregar o painel. Verifique a ligação à API.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user, status, navigate]);


  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'ADMIN';

  const handleCreateClassSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newClassName.trim()) {
      setClassFormError('Indique um nome para a turma.');
      return;
    }

    setClassFormError(null);
    setIsCreatingClass(true);
    try {
      const created = await classesApi.create({
        name: newClassName.trim(),
        description: newClassDescription.trim() || undefined,
      });
      setClasses((prev) => [created, ...prev]);
      setNewClassName('');
      setNewClassDescription('');
      setShowCreateClassForm(false);
    } catch (createError: any) {
      console.error('[Dashboard] Erro ao criar turma:', createError);
      setClassFormError(
        createError?.message || 'Não foi possível criar a turma. Tente novamente.',
      );
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleCancelCreateClass = () => {
    setShowCreateClassForm(false);
    setClassFormError(null);
    setNewClassName('');
    setNewClassDescription('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 mobile-safe-top mobile-safe-bottom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Bem-vindo(a),
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {user?.name || user?.email}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Perfil:{' '}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[10px] font-semibold">
                {user?.role}
              </span>
            </p>
          </div>
          {isStudent && (
            <span className="px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium shadow-sm border border-blue-200 dark:border-blue-800">
              Veja abaixo os quizzes atribuídos a si
            </span>
          )}
        </div>

        {/* Secondary Navigation - Teacher & Admin */}
        <SecondaryNav pendingPublicSharesCount={pendingPublicSharesCount} />

        {/* Error / Loading */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            A carregar o seu painel personalizado...
          </div>
        )}

        {/* Teacher view */}
        {isTeacher && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Classes */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    As suas turmas
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Turmas onde é responsável.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {classes.length} turma(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setClassFormError(null);
                      setShowCreateClassForm((prev) => !prev);
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-all"
                  >
                    {showCreateClassForm ? 'Fechar' : 'Nova turma'}
                  </button>
                </div>
              </div>
              {showCreateClassForm && (
                <form
                  onSubmit={handleCreateClassSubmit}
                  className="space-y-2 border border-dashed border-primary-200 dark:border-primary-500/30 rounded-lg p-3 bg-primary-50/40 dark:bg-primary-900/10"
                >
                  {classFormError && (
                    <p className="text-[11px] text-red-600 dark:text-red-400">{classFormError}</p>
                  )}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Nome da turma
                    </label>
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm"
                      placeholder="Ex.: Matemática 7ºA"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                      Descrição (opcional)
                    </label>
                    <textarea
                      value={newClassDescription}
                      onChange={(e) => setNewClassDescription(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm"
                      rows={2}
                      placeholder="Notas internas para si."
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelCreateClass}
                      className="text-[11px] px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingClass}
                      className="text-[11px] px-3 py-1 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 transition-all"
                    >
                      {isCreatingClass ? 'A criar...' : 'Criar turma'}
                    </button>
                  </div>
                </form>
              )}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {classes.length === 0 && (
                  <div className="text-[11px] text-gray-400">
                    {isTeacher
                      ? 'Ainda não tem turmas. Utilize o botão acima para criar a primeira.'
                      : 'Ainda não há turmas associadas à sua conta.'}
                  </div>
                )}
                {classes.map((c) => (
                  <div
                    key={c.id}
                    className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 flex flex-col"
                  >
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {c.name}
                    </span>
                    {c.description && (
                      <span className="text-[10px] text-gray-500 truncate">
                        {c.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Assignments */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Assignments ativos
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  {assignments.filter((a) => a.isActive).length} ativos
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Resumo dos quizzes atribuídos a turmas/alunos. Liga aos fluxos de attempts.
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {assignments.length === 0 && (
                  <div className="text-[11px] text-gray-400">
                    Ainda não existem assignments. Crie um quiz e atribua a uma turma.
                  </div>
                )}
                {assignments.slice(0, 6).map((a) => (
                  <div
                    key={a.id}
                    className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-700 dark:text-gray-200">
                        Quiz: {a.quizId}
                      </span>
                      <span className="text-[9px] text-gray-500">
                        {a.classId ? `Turma: ${a.classId}` : a.studentId ? `Estudante: ${a.studentId}` : 'Alvo não definido'}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full ${
                        a.isActive
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {a.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared quizzes */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Quizzes partilhados consigo
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                  {sharedWithMe.length}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Quizzes recebidos de outros professores. Pode consultar e fazer fork conforme permissões.
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {sharedWithMe.length === 0 && (
                  <div className="text-[11px] text-gray-400">
                    Ainda não há quizzes partilhados consigo.
                  </div>
                )}
                {sharedWithMe.slice(0, 6).map((q) => (
                  <div
                    key={q.shareId}
                    className="px-3 py-2 rounded-lg bg-purple-50/40 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {q.title}
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full border border-purple-300 text-purple-700">
                        {q.canEdit ? 'Pode editar' : 'Só leitura'}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-500">
                      Owner: {q.ownerId}
                    </span>
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          // Validate quiz ID before navigation
                          if (!q.quizId || q.quizId === 'undefined' || q.quizId === 'null' || q.quizId.trim() === '') {
                            console.error('[Dashboard] Invalid quiz ID for navigation:', q.quizId);
                            alert('Não é possível ver o quiz: ID inválido.');
                            return;
                          }
                          console.log('[Dashboard] Navigating to quiz with ID:', q.quizId);
                          navigate(`/quiz/${q.quizId}`);
                        }}
                        className="text-[9px] px-2 py-0.5 rounded-lg bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                      >
                        Ver quiz
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          // Validate quiz ID before forking
                          if (!q.quizId || q.quizId === 'undefined' || q.quizId === 'null' || q.quizId.trim() === '') {
                            console.error('[Dashboard] Invalid quiz ID for fork:', q.quizId);
                            alert('Não é possível fazer o fork do quiz: ID inválido.');
                            return;
                          }
                          console.log('[Dashboard] Forking quiz with ID:', q.quizId);
                          try {
                            await sharesApi.forkSharedQuiz(q.quizId);
                            // Simple feedback; list refresh can be added.
                            // eslint-disable-next-line no-alert
                            alert('Fork criado com sucesso. Veja os seus quizzes.');
                          } catch (e) {
                            // eslint-disable-next-line no-alert
                            alert('Não foi possível criar o fork deste quiz.');
                          }
                        }}
                        className="text-[9px] px-2 py-0.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-all"
                      >
                        Fazer fork
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Student view */}
        {isStudent && !loading && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Os seus assignments
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Estes são os quizzes que os seus professores atribuíram. Ao iniciar,
              será criada uma tentativa (attempt) conforme o contrato da API.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.length === 0 && (
                <div className="text-[11px] text-gray-400">
                  Ainda não tem assignments atribuídos. Volte mais tarde ou confirme com o seu professor.
                </div>
              )}
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 flex flex-col justify-between gap-2"
                >
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500">
                      Quiz: {a.quizId}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full ${
                          a.isActive
                            ? 'bg-green-50 text-green-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {a.isActive ? 'Disponível' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      // Validate quiz ID before starting attempt
                      if (!a.quizId || a.quizId === 'undefined' || a.quizId === 'null' || a.quizId.trim() === '') {
                        console.error('[Dashboard] Invalid quiz ID for attempt:', a.quizId);
                        alert('Não é possível iniciar o quiz: ID inválido.');
                        return;
                      }
                      
                      console.log('[Dashboard] Starting attempt for quiz with ID:', a.quizId);
                      try {
                        const { attemptsApi } = await import('../lib/api');
                        const attempt = await attemptsApi.start(
                          a.quizId,
                          a.id,
                        );
                        navigate(`/quiz/${attempt.quizId}`, {
                          state: { attemptId: attempt.id },
                        });
                      } catch (e) {
                        // eslint-disable-next-line no-alert
                        alert(
                          'Não foi possível iniciar o attempt. Verifique a disponibilidade do assignment.',
                        );
                      }
                    }}
                    disabled={!a.isActive}
                    className={`mt-1 text-[10px] px-3 py-1 rounded-lg font-medium transition-all ${
                      a.isActive
                        ? 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-sm hover:-translate-y-0.5'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {a.isActive ? 'Iniciar quiz' : 'Indisponível'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

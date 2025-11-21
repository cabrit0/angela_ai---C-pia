import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth/AuthContext';
import { registerUser } from '../lib/api/httpClient';

/**
 * Página de Autenticação:
 * - Login para qualquer role (ADMIN/TEACHER/STUDENT)
 * - Registo rápido de TEACHER (usa /api/auth/register do backend)
 * - Visual apelativo alinhado com o resto da UI.
 */
const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const roleOptions: Array<{
    value: 'TEACHER' | 'STUDENT' | 'ADMIN'
    label: string
    description: string
  }> = [
    { value: 'TEACHER', label: 'Professor', description: 'Cria quizzes e gere turmas' },
    { value: 'STUDENT', label: 'Aluno', description: 'Recebe assignments e responde' },
    { value: 'ADMIN', label: 'Administrador', description: 'Administra toda a plataforma' },
  ];

  const [mode, setMode] = useState<'login' | 'register-teacher'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerRole, setRegisterRole] = useState<'TEACHER' | 'STUDENT' | 'ADMIN'>('TEACHER');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const resetState = () => {
    setError(null);
    setIsSubmitting(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    try {
      setIsSubmitting(true);
      await authLogin(email.trim(), password);
      navigate('/');
    } catch (err: any) {
      const fallbackMessage =
        'NA�o foi possA-vel iniciar sessA�o. Verifique as credenciais ou tente novamente.'
      if (err?.code === 403) {
        const normalized = String(err?.message ?? '').toLowerCase()
        if (normalized.includes('pending')) {
          setError('A sua conta ainda aguarda aprovaA�o de um administrador.')
          setInfoMessage('Assim que um administrador aprovar o registo receberA� notificaA�o por email.')
        } else if (normalized.includes('rejected')) {
          setError('A sua conta foi rejeitada. Contacte o suporte para mais detalhes.')
          setInfoMessage(null)
        } else {
          setError(err?.message || fallbackMessage)
          setInfoMessage(null)
        }
      } else {
        setError(err?.message || fallbackMessage)
        setInfoMessage(null)
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    if (!name.trim() || !email.trim() || !password) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role: registerRole,
      });

      const requestedRole =
        roleOptions.find((option) => option.value === registerRole)?.label ?? 'Conta'

      setInfoMessage(
        `${requestedRole} criada para ${response.user.email}. Aguarde a aprovação de um administrador para iniciar sessão.`
      )
      setMode('login')
      setPassword('')
      setConfirmPassword('')
      setRegisterRole('TEACHER')
      setError(null)
    } catch (err: any) {
      setError(
        err?.message ||
          'Não foi possível criar a conta. Verifique os dados e tente novamente.'
      );
      setInfoMessage(null)
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = (next: 'login' | 'register-teacher') => {
    setMode(next);
    setError(null);
    if (next === 'register-teacher') {
      setInfoMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left panel - brand and value prop */}
        <div className="space-y-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100/70 text-primary-700 text-xs font-semibold tracking-wide shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary-500 mr-2 animate-pulse"></span>
            Plataforma Kwiz
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
            Entre na sua área
            <span className="block text-primary-600 dark:text-primary-400">
              Professores e Estudantes
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md">
            Crie quizzes envolventes com IA, partilhe com outros docentes, atribua a turmas
            e acompanhe o desempenho dos seus estudantes numa experiência simples, moderna
            e focada em educação.
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-center">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mr-2">✓</span>
              Professores criam e gerem quizzes, turmas e assignments
            </li>
            <li className="flex items-center">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs mr-2">✓</span>
              Estudantes entram com a sua conta e respondem aos quizzes atribuídos
            </li>
            <li className="flex items-center">
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs mr-2">✓</span>
              Administradores gerem contas, quizzes e toda a plataforma
            </li>
          </ul>
        </div>

        {/* Right panel - auth card */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100/80 dark:border-gray-800/80 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                {mode === 'login' ? 'Aceder à conta' : 'Criar conta de professor'}
              </p>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {mode === 'login'
                  ? 'Inicie sessão no Kwiz'
                  : 'Registe-se como Professor'}
              </h2>
            </div>
            <div className="flex flex-col items-end text-[10px] text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                API: ligado
              </span>
            </div>
          </div>

          <div className="flex text-xs bg-gray-50 dark:bg-gray-900 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => toggleMode('login')}
              className={`flex-1 px-3 py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              Já tenho conta
            </button>
            <button
              type="button"
              onClick={() => toggleMode('register-teacher')}
              className={`flex-1 px-3 py-2 rounded-lg transition-all ${
                mode === 'register-teacher'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              Sou professor novo
            </button>
          </div>

          {infoMessage && (
            <div className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <p>{infoMessage}</p>
            </div>
          )}

          {error && (
            <div className="text-xs bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-start gap-2">
              <span className="mt-0.5">!</span>
              <p>{error}</p>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Email institucional
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="nome@escola.pt"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Palavra-passe
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-2 inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-secondary-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all ${
                  isSubmitting ? 'opacity-70 cursor-wait' : ''
                }`}
              >
                {isSubmitting ? 'A validar...' : 'Entrar na plataforma'}
              </button>

              <p className="text-[10px] text-gray-500 text-center">
                ADMIN, PROFESSOR e STUDENT entram aqui com as credenciais atribuídas pelo sistema.
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegisterTeacher} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Ex: Ana Silva"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Email institucional
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="nome@escola.pt"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Perfil pretendido
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {roleOptions.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setRegisterRole(option.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        registerRole === option.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-200'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
                      }`}
                      aria-pressed={registerRole === option.value}
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{option.description}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Todos os registos passam por validaA�o do administrador antes de terem acesso completo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Palavra-passe
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Confirmar
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Repita a palavra-passe"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-2 inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-secondary-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all ${
                  isSubmitting ? 'opacity-70 cursor-wait' : ''
                }`}
              >
                {isSubmitting ? 'A criar conta...' : 'Criar conta de Professor'}
              </button>

              <p className="text-[10px] text-gray-500 text-center">
                A conta criada terá role TEACHER conforme o contrato da API. Contas STUDENT e ADMIN são
                geridas por mecanismos próprios do backend/painel administrativo.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

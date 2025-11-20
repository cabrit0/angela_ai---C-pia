import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { httpClient, type AuthUser, type UserRole, type UserStatus } from '../lib/api/httpClient'

type ManagedUser = AuthUser & {
  createdAt?: string
  updatedAt?: string
}

type StatusFilter = UserStatus | 'ALL'
type RoleFilter = UserRole | 'ALL'

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: 'Ativa',
  PENDING: 'Pendente',
  REJECTED: 'Rejeitada',
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  TEACHER: 'Professor',
  STUDENT: 'Aluno',
}

const statusStyles: Record<UserStatus, string> = {
  ACTIVE: 'bg-green-50 text-green-700 border border-green-200',
  PENDING: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
}

const formatDateTime = (value?: string): string => {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('pt-PT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await httpClient.adminListUsers()
      setUsers(data ?? [])
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar as contas.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return users.filter((user) => {
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
      const matchesSearch =
        search.length === 0 ||
        user.name?.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      return matchesStatus && matchesRole && matchesSearch
    })
  }, [users, statusFilter, roleFilter, searchTerm])

  const overview = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc.total += 1
        acc[user.status] += 1
        return acc
      },
      { total: 0, ACTIVE: 0, PENDING: 0, REJECTED: 0 } as Record<'total' | UserStatus, number>,
    )
  }, [users])

  const runAdminAction = useCallback(
    async (userId: string, action: () => Promise<unknown>, successMessage: string) => {
      setPendingActionId(userId)
      setError(null)
      try {
        await action()
        setInfoMessage(successMessage)
        await loadUsers()
      } catch (err: any) {
        setError(err?.message || 'A ação não pôde ser concluída.')
      } finally {
        setPendingActionId(null)
      }
    },
    [loadUsers],
  )

  const handleApprove = (userId: string) =>
    runAdminAction(userId, () => httpClient.adminApproveUser(userId), 'Conta aprovada com sucesso.')

  const handleReject = (userId: string) =>
    runAdminAction(
      userId,
      () => httpClient.adminRejectUser(userId),
      'Conta marcada como rejeitada.',
    )

  const handleDelete = (userId: string) =>
    runAdminAction(userId, () => httpClient.adminDeleteUser(userId), 'Conta removida definitivamente.')

  const handleRestore = (userId: string) =>
    runAdminAction(
      userId,
      () => httpClient.adminUpdateUserStatus(userId, 'PENDING'),
      'Conta voltou ao estado pendente.',
    )

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestão de contas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aprove ou rejeite novos registos e acompanhe o estado das contas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadUsers()}
          className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          disabled={isLoading}
        >
          Atualizar
        </button>
      </div>

      {infoMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-100">
          {infoMessage}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs uppercase text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview.total}</p>
        </div>
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/30">
          <p className="text-xs uppercase text-yellow-700">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-800">{overview.PENDING}</p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/30">
          <p className="text-xs uppercase text-green-700">Ativas</p>
          <p className="text-2xl font-bold text-green-800">{overview.ACTIVE}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/30">
          <p className="text-xs uppercase text-red-700">Rejeitadas</p>
          <p className="text-2xl font-bold text-red-800">{overview.REJECTED}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Estado</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendentes</option>
              <option value="ACTIVE">Ativas</option>
              <option value="REJECTED">Rejeitadas</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Perfil</label>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="ALL">Todos</option>
              <option value="TEACHER">Professores</option>
              <option value="STUDENT">Alunos</option>
              <option value="ADMIN">Administradores</option>
            </select>
          </div>
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-medium text-gray-500">Pesquisar</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Procurar por nome ou email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Utilizador
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Perfil
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Criado em
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    A carregar contas...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    Nenhum registo encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[user.status]}`}>
                        {statusLabels[user.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex flex-wrap justify-end gap-2">
                        {user.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(user.id)}
                              disabled={pendingActionId === user.id}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Aprovar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(user.id)}
                              disabled={pendingActionId === user.id}
                              className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Rejeitar
                            </button>
                          </>
                        )}
                        {user.status === 'REJECTED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRestore(user.id)}
                              disabled={pendingActionId === user.id}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                              Voltar para pendente
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(user.id)}
                              disabled={pendingActionId === user.id}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                        {user.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleReject(user.id)}
                            disabled={pendingActionId === user.id}
                            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Suspender
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminUsers


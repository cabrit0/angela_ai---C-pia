import React, { useState, useEffect } from 'react';
import { publicSharesApi } from '../lib/api';
import SecondaryNav from '../components/SecondaryNav';

const AdminPublicShares: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const filterValue = filter === 'ALL' ? undefined : filter;
      const data = await publicSharesApi.listAllRequests(filterValue);
      setRequests(data);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm('Tem certeza que deseja aprovar este pedido?')) {
      return;
    }

    try {
      await publicSharesApi.approveRequest(requestId);
      await loadRequests();
    } catch (e: any) {
      setError(e?.message || 'Erro ao aprovar pedido');
    }
  };

  const handleReject = async (requestId: string) => {
    setSelectedRequestId(requestId);
  };

  const confirmReject = async () => {
    if (!selectedRequestId) return;

    try {
      await publicSharesApi.rejectRequest(selectedRequestId, rejectionReason);
      setSelectedRequestId(null);
      setRejectionReason('');
      await loadRequests();
    } catch (e: any) {
      setError(e?.message || 'Erro ao rejeitar pedido');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pedidos de Compartilhamento Público
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gerir pedidos de professores para compartilhar quizzes com todos
          </p>
        </div>

        {/* Secondary Navigation */}
        <SecondaryNav />

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    filter === tab
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                {tab === 'PENDING' && 'Pendentes'}
                {tab === 'APPROVED' && 'Aprovados'}
                {tab === 'REJECTED' && 'Rejeitados'}
                {tab === 'ALL' && 'Todos'}
              </button>
            ))}
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
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum pedido encontrado
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
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
                    <div className="mt-3 space-y-1 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Solicitado por:</span>{' '}
                        {request.requestedByTeacherId?.name} ({request.requestedByTeacherId?.email})
                      </p>
                      {request.requestMessage && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Mensagem:</span> {request.requestMessage}
                        </p>
                      )}
                      <p className="text-gray-500 dark:text-gray-500">
                        Criado em: {new Date(request.createdAt).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
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

                {request.status === 'APPROVED' && request.reviewedByAdminId && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <span className="font-medium">Aprovado por:</span>{' '}
                      {request.reviewedByAdminId.name} em{' '}
                      {new Date(request.reviewedAt).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                )}

                {request.status === 'REJECTED' && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {request.rejectionReason && (
                      <p>
                        <span className="font-medium">Motivo da rejeição:</span>{' '}
                        {request.rejectionReason}
                      </p>
                    )}
                    {request.reviewedByAdminId && (
                      <p>
                        <span className="font-medium">Rejeitado por:</span>{' '}
                        {request.reviewedByAdminId.name} em{' '}
                        {new Date(request.reviewedAt).toLocaleDateString('pt-PT')}
                      </p>
                    )}
                  </div>
                )}

                {request.status === 'PENDING' && (
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rejection Modal */}
        {selectedRequestId && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Rejeitar Pedido
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivo da rejeição (opcional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Explique o motivo da rejeição..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={confirmReject}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirmar Rejeição
                </button>
                <button
                  onClick={() => {
                    setSelectedRequestId(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPublicShares;

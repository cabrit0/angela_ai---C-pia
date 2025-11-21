import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth/AuthContext';
import type { ApiTestResult, AiProvider } from '../types/settings';
import {
  testPollinationsConnectivity,
  testHuggingFaceConnectivity,
  testMistralConnectivity,
  saveApiTestResult,
  getApiTestResults
} from '../lib/utils/storage';
import { validateToken, getBestPractices } from '../lib/api/apiConfig';
import { userSettingsApi, type UserSettings } from '../lib/api';
import AiProviderSelector from '../components/AiProviderSelector';
import ApiKeyInput from '../components/ApiKeyInput';
import PrivacyNotice from '../components/PrivacyNotice';

// Icon components
const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);


const KeyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const BoltIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const InformationCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [huggingFaceToken, setHuggingFaceToken] = useState<string>('');
  const [mistralToken, setMistralToken] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [showTestResults, setShowTestResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'providers' | 'keys' | 'test' | 'info'>('info');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is a student and redirect them
  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  // Load settings from backend
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await userSettingsApi.get();
        setSettings(data);
        setHuggingFaceToken(data.huggingFaceToken || '');
        setMistralToken(data.mistralToken || '');
      } catch (err: any) {
        console.error('Erro ao carregar configurações:', err);
        setError('Erro ao carregar configurações. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadUserSettings();
    }
  }, [user]);

  useEffect(() => {
    const results = getApiTestResults();
    setTestResults(results);
  }, []);

  const handleTextProviderChange = async (provider: AiProvider) => {
    if (!settings) return;
    try {
      const updated = await userSettingsApi.update({ textProvider: provider });
      setSettings(updated);
    } catch (err: any) {
      console.error('Erro ao atualizar textProvider:', err);
      setError('Erro ao atualizar configuração. Tente novamente.');
    }
  };

  const handleImageProviderChange = async (provider: AiProvider) => {
    if (!settings) return;
    try {
      const updated = await userSettingsApi.update({ imageProvider: provider });
      setSettings(updated);
    } catch (err: any) {
      console.error('Erro ao atualizar imageProvider:', err);
      setError('Erro ao atualizar configuração. Tente novamente.');
    }
  };

  const handleTokenChange = async (token: string) => {
    setHuggingFaceToken(token);
    try {
      const updated = await userSettingsApi.update({
        huggingFaceToken: token || null
      });
      setSettings(updated);
    } catch (err: any) {
      console.error('Erro ao salvar token HuggingFace:', err);
      setError('Erro ao salvar token. Tente novamente.');
    }
  };

  const handleMistralTokenChange = async (token: string) => {
    setMistralToken(token);
    try {
      const updated = await userSettingsApi.update({
        mistralToken: token || null
      });
      setSettings(updated);
    } catch (err: any) {
      console.error('Erro ao salvar token Mistral:', err);
      setError('Erro ao salvar token. Tente novamente.');
    }
  };

  const testConnectivity = async () => {
    setIsTesting(true);
    const newResults: ApiTestResult[] = [];

    try {
      // Test text provider
      if (settings.textProvider === 'pollinations') {
        const result = await testPollinationsConnectivity('text');
        newResults.push(result);
        saveApiTestResult(result);
      } else if (settings.textProvider === 'huggingface') {
        const result = await testHuggingFaceConnectivity(huggingFaceToken, 'text');
        newResults.push(result);
        saveApiTestResult(result);
      } else if (settings.textProvider === 'mistral') {
        const result = await testMistralConnectivity(mistralToken, 'text');
        newResults.push(result);
        saveApiTestResult(result);
      }

      // Test image provider
      if (settings.imageProvider === 'pollinations') {
        const result = await testPollinationsConnectivity('image');
        newResults.push(result);
        saveApiTestResult(result);
      } else if (settings.imageProvider === 'huggingface') {
        const result = await testHuggingFaceConnectivity(huggingFaceToken, 'image');
        newResults.push(result);
        saveApiTestResult(result);
      } else if (settings.imageProvider === 'mistral') {
        const result = await testMistralConnectivity(mistralToken, 'image');
        newResults.push(result);
        saveApiTestResult(result);
      }

      setTestResults(newResults.concat(testResults));
      setShowTestResults(true);
    } catch (error) {
      console.error('Error testing connectivity:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const getTestResultForProvider = (provider: AiProvider, type: 'text' | 'image') => {
    return testResults.find(result => result.provider === provider && result.type === type);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-PT');
  };

  const tabs = user && (user.role === 'TEACHER' || user.role === 'ADMIN') ? [
    { id: 'providers', label: 'Provedores', icon: <SparklesIcon /> },
    { id: 'keys', label: 'Chaves de API', icon: <KeyIcon /> },
    { id: 'test', label: 'Teste', icon: <BoltIcon /> },
    { id: 'info', label: 'Informações', icon: <InformationCircleIcon /> },
  ] as const : [
    { id: 'info', label: 'Informações', icon: <InformationCircleIcon /> },
  ] as const;

  type TabId = (typeof tabs)[number]['id'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 page-transition-enter-active">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200 slide-in-top-fade">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                title="Voltar"
              >
                <ChevronLeftIcon />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Definições</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Configure provedores de IA e chaves de API</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200 slide-in-bottom-fade">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile: compact, centered, scrollable icon-only tabs; Desktop: icon + label as before */}
          <div className="flex items-center justify-center sm:justify-start gap-4 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`relative flex flex-col items-center sm:flex-row sm:items-center py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors transition-transform duration-150 ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                  } ${isActive ? 'tab-header-active' : 'tab-header-inactive'}`}
                >
                  {/* Icon: always visible */}
                  <span className="text-lg flex items-center justify-center">
                    {tab.icon}
                  </span>
                  {/* Label: hidden on small screens, visible from sm and up */}
                  <span className="hidden sm:inline ml-0 sm:ml-2">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <ExclamationIcon />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Carregando configurações...</p>
            </div>
          </div>
        ) : !settings ? (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 dark:bg-gray-800 dark:border-gray-700">
            <p className="text-center text-gray-600 dark:text-gray-400">Erro ao carregar configurações.</p>
          </div>
        ) : (
        <div key={activeTab} className="settings-tab-transition">
        {/* Providers Tab */}
        {activeTab === 'providers' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-gray-700 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30 transition-colors duration-200">
                    <SparklesIcon />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">Fornecedores de IA</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Escolha os provedores para geração de texto e imagens</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <AiProviderSelector
                  label="Fornecedor para Geração de Texto"
                  value={settings.textProvider}
                  onChange={handleTextProviderChange}
                />
               
                <AiProviderSelector
                  label="Fornecedor para Geração de Imagens"
                  value={settings.imageProvider}
                  onChange={handleImageProviderChange}
                />
              </div>
            </div>

            {/* Provider Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">Informações dos Provedores</h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Pollinations */}
                <div className="border border-gray-200 rounded-lg p-4 dark:border-gray-600 dark:bg-gray-700/50 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-200">Pollinations</h4>
                    <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900/30 dark:text-green-300 transition-colors duration-200">
                      Gratuito
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 dark:text-gray-400 transition-colors duration-200">
                    Serviço gratuito sem necessidade de registo ou chave de API. Ideal para uso casual e testes.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-300 transition-colors duration-200">Vantagens:</h5>
                      <ul className="text-sm text-gray-600 space-y-1 dark:text-gray-400 transition-colors duration-200">
                        <li className="flex items-center">
                          <CheckIcon />
                          <span className="ml-2">Totalmente gratuito</span>
                        </li>
                        <li className="flex items-center">
                          <CheckIcon />
                          <span className="ml-2">Sem registo necessário</span>
                        </li>
                        <li className="flex items-center">
                          <CheckIcon />
                          <span className="ml-2">Múltiplos idiomas</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-300 transition-colors duration-200">Limitações:</h5>
                      <ul className="text-sm text-gray-600 space-y-1 dark:text-gray-400 transition-colors duration-200">
                        <li className="flex items-center">
                          <ExclamationIcon />
                          <span className="ml-2">Limites de taxa em horários de pico</span>
                        </li>
                        <li className="flex items-center">
                          <ExclamationIcon />
                          <span className="ml-2">Menor prioridade</span>
                        </li>
                        <li className="flex items-center">
                          <ExclamationIcon />
                          <span className="ml-2">Modelos limitados</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Hugging Face */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-900">Hugging Face</h4>
                    <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Plano Gratuito
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Plataforma de IA com modelos avançados e gratuitos. Requer token gratuito para acesso.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Vantagens:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li className="flex items-center">
                          <CheckIcon />
                          <span className="ml-2">Modelos de IA avançados</span>
                        </li>
                        <li className="flex items-center">
                          <CheckIcon />
                          <span className="ml-2">Alta qualidade</span>
                        </li>
                        <li className="flex items-center">
                          <CheckIcon />
                          <span className="ml-2">Múltiplos modelos</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Limitações:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li className="flex items-center">
                          <ExclamationIcon />
                          <span className="ml-2">30 requisições/minuto</span>
                        </li>
                        <li className="flex items-center">
                          <ExclamationIcon />
                          <span className="ml-2">Requer token</span>
                        </li>
                        <li className="flex items-center">
                          <ExclamationIcon />
                          <span className="ml-2">Tempo de carregamento</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Mistral */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-900">Mistral</h4>
                    <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                      API Direta
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    API direta do Mistral com modelos de alta performance. Requer chave de API.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Vantagens:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li className="flex items-center">
                          <CheckIcon />
                          <span className="ml-2">Modelos da última geração</span>
                        </li>
                        <li className="flex items-center">
                          <CheckIcon />
                          <span className="ml-2">Alta performance</span>
                        </li>
                        <li className="flex items-center">
                          <CheckIcon />
                          <span className="ml-2">API estável</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Limitações:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li className="flex items-center">
                          <ExclamationIcon />
                          <span className="ml-2">Cobrado por token</span>
                        </li>
                        <li className="flex items-center">
                          <ExclamationIcon />
                          <span className="ml-2">Requer chave de API</span>
                        </li>
                        <li className="flex items-center">
                          <ExclamationIcon />
                          <span className="ml-2">Não suporta imagens</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Keys Tab */}
        {activeTab === 'keys' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <KeyIcon />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Chaves de API</h2>
                    <p className="text-sm text-gray-600">Configure tokens e chaves de API para os provedores</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {(settings.textProvider === 'huggingface' || settings.imageProvider === 'huggingface') ||
                 (settings.textProvider === 'mistral' || settings.imageProvider === 'mistral') ? (
                  <div className="space-y-6">
                    {settings.textProvider === 'huggingface' || settings.imageProvider === 'huggingface' ? (
                      <div>
                        <ApiKeyInput
                          label="Token do Hugging Face"
                          value={huggingFaceToken}
                          onChange={handleTokenChange}
                          placeholder="hf_..."
                          helpText="Token necessário para usar Hugging Face. Veja instruções abaixo."
                        />
                        
                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="text-sm font-semibold text-blue-900 mb-3">Como obter o seu token gratuito:</h3>
                          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                            <li>Aceda a <a href="https://huggingface.co/join" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">huggingface.co/join</a> para criar uma conta gratuita</li>
                            <li>Após o registo, aceda a <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">huggingface.co/settings/tokens</a></li>
                            <li>Clique em "New token"</li>
                            <li>Dê um nome para o token (ex: "quiz-app")</li>
                            <li>Selecione "read" como permissão</li>
                            <li>Copie o token gerado (Começa com "hf_")</li>
                            <li>Cole o token no campo acima</li>
                          </ol>
                        </div>
                        
                        {/* Token Validation */}
                        {huggingFaceToken && (
                          <div className={`p-4 rounded-lg ${
                            validateToken('huggingface', huggingFaceToken).valid
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-yellow-50 border border-yellow-200'
                          }`}>
                            <div className="flex items-center">
                              {validateToken('huggingface', huggingFaceToken).valid ? (
                                <CheckIcon />
                              ) : (
                                <ExclamationIcon />
                              )}
                              <p className={`ml-2 text-sm ${
                                validateToken('huggingface', huggingFaceToken).valid
                                  ? 'text-green-800'
                                  : 'text-yellow-800'
                              }`}>
                                {validateToken('huggingface', huggingFaceToken).message}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                    
                    {settings.textProvider === 'mistral' || settings.imageProvider === 'mistral' ? (
                      <div>
                        <ApiKeyInput
                          label="Chave de API do Mistral"
                          value={mistralToken}
                          onChange={handleMistralTokenChange}
                          placeholder="Sua chave de API do Mistral"
                          helpText="Chave de API necessária para usar Mistral. Veja instruções abaixo."
                        />
                        
                        {/* Instructions */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <h3 className="text-sm font-semibold text-purple-900 mb-3">Como obter a sua chave de API:</h3>
                          <ol className="text-sm text-purple-800 space-y-2 list-decimal list-inside">
                            <li>Aceda a <a href="https://console.mistral.ai/" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-900">console.mistral.ai</a> para criar uma conta</li>
                            <li>Após o registo, aceda a <a href="https://console.mistral.ai/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-900">console.mistral.ai/api-keys</a></li>
                            <li>Clique em "Create new key"</li>
                            <li>Dê um nome para a chave (ex: "quiz-app")</li>
                            <li>Copie a chave gerada</li>
                            <li>Cole a chave no campo acima</li>
                          </ol>
                        </div>
                        
                        {/* Key Validation */}
                        {mistralToken && (
                          <div className={`p-4 rounded-lg ${
                            validateToken('mistral', mistralToken).valid
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-yellow-50 border border-yellow-200'
                          }`}>
                            <div className="flex items-center">
                              {validateToken('mistral', mistralToken).valid ? (
                                <CheckIcon />
                              ) : (
                                <ExclamationIcon />
                              )}
                              <p className={`ml-2 text-sm ${
                                validateToken('mistral', mistralToken).valid
                                  ? 'text-green-800'
                                  : 'text-yellow-800'
                              }`}>
                                {validateToken('mistral', mistralToken).message}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckIcon />
                      <p className="ml-2 text-sm text-green-800">
                        <strong>Pollinations:</strong> Não requer token ou registo. Uso completamente gratuito!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BoltIcon />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Teste de Conectividade</h2>
                    <p className="text-sm text-gray-600">Verifique se as APIs estão a funcionar corretamente</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <button
                    onClick={testConnectivity}
                    disabled={isTesting}
                    className="btn-hover-bounce btn-hover-ripple inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <BoltIcon />
                    <span className="ml-2">{isTesting ? 'A testar...' : 'Testar Conectividade'}</span>
                  </button>
                  
                  <p className="mt-2 text-sm text-gray-600">
                    Testa a ligação com as APIs selecionadas para verificar se estão a funcionar corretamente.
                  </p>
                </div>

                {/* Test Results */}
                {showTestResults && testResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Resultados recentes:</h3>
                    
                    {/* Text Test */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Texto - {settings.textProvider === 'pollinations' ? 'Pollinations' : settings.textProvider === 'huggingface' ? 'Hugging Face' : 'Mistral'}
                        </span>
                        {(() => {
                          const result = getTestResultForProvider(settings.textProvider, 'text');
                          return result ? (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              result.success
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.success ? 'Sucesso' : 'Falha'}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      {(() => {
                        const result = getTestResultForProvider(settings.textProvider, 'text');
                        return result ? (
                          <p className="text-sm text-gray-600 mt-2">{result.message}</p>
                        ) : null;
                      })()}
                    </div>

                    {/* Image Test */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Imagem - {settings.imageProvider === 'pollinations' ? 'Pollinations' : settings.imageProvider === 'huggingface' ? 'Hugging Face' : 'Mistral'}
                        </span>
                        {(() => {
                          const result = getTestResultForProvider(settings.imageProvider, 'image');
                          return result ? (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              result.success
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.success ? 'Sucesso' : 'Falha'}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      {(() => {
                        const result = getTestResultForProvider(settings.imageProvider, 'image');
                        return result ? (
                          <p className="text-sm text-gray-600 mt-2">{result.message}</p>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Best Practices */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <InformationCircleIcon />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Melhores Práticas</h2>
                    <p className="text-sm text-gray-600">Dicas para obter os melhores resultados</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {getBestPractices(settings.textProvider).map((practice, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <CheckIcon />
                      </div>
                      <p className="ml-3 text-sm text-gray-700">{practice}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* App Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Sobre a Aplicação</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Versão:</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Armazenamento:</span>
                    <span>Servidor (seguro)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Última atualização:</span>
                    <span>{settings.updatedAt ? new Date(settings.updatedAt).toLocaleString('pt-PT') : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <PrivacyNotice />
          </div>
        )}
        </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

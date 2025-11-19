import { useState, useEffect, useCallback, useRef } from 'react';
import { getAvailableStorage, isLocalStorageAvailable, isSessionStorageAvailable } from '../lib/utils/storage';

/**
 * Hook customizado para sincronizar estado com localStorage
 * @param key Chave para armazenar os dados
 * @param defaultValue Valor padrão quando não há dados no storage
 * @param useSessionStorageForced Forçar uso de sessionStorage mesmo que localStorage esteja disponível
 * @returns [value, setValue, isStorageAvailable] - Valor atual, função para atualizar e se o storage está disponível
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  useSessionStorageForced: boolean = false
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(defaultValue);
  // Estado para controlar se o storage está disponível
  const [isStorageAvailable, setIsStorageAvailable] = useState(false);

  // Função para obter o valor do storage

  // Função para salvar valor no storage
  const setValueToStorage = useCallback((value: T) => {
    try {
      const storage = getAvailableStorage();
      if (!storage) {
        console.warn('Storage não disponível. Valor não será persistido.');
        return false;
      }

      const serializedValue = JSON.stringify(value);
      storage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.error(`Erro ao salvar no storage (chave: ${key}):`, error);
      
      // Se for erro de quota, tentar limpar espaço
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        try {
          // Tentar remover itens antigos (apenas se não for a chave atual)
          const currentStorage = getAvailableStorage();
          if (currentStorage) {
            const keysToRemove: string[] = [];
            for (let i = 0; i < currentStorage.length; i++) {
              const storageKey = currentStorage.key(i);
              if (storageKey && storageKey !== key && storageKey.startsWith('quiz-app-')) {
                keysToRemove.push(storageKey);
              }
            }
            
            // Remover itens mais antigos (limitado a 5)
            keysToRemove.slice(0, 5).forEach(k => currentStorage.removeItem(k));
            
            // Tentar salvar novamente
            currentStorage.setItem(key, JSON.stringify(value));
          }
          console.warn('Storage cheio. Itens antigos foram removidos para liberar espaço.');
          return true;
        } catch (cleanupError) {
          console.error('Erro ao limpar espaço no storage:', cleanupError);
        }
      }
      
      return false;
    }
  }, [key]);

  // Usar refs para armazenar valores estáticos que não devem mudar entre renders
  const storageCheckRef = useRef<boolean>(false);
  
  // Inicializar o estado e verificar disponibilidade do storage
  useEffect(() => {
    // Evitar múltiplas verificações de storage
    if (storageCheckRef.current) {
      return;
    }
    
    const checkStorageAvailability = () => {
      const isAvailable = useSessionStorageForced
        ? isSessionStorageAvailable()
        : isLocalStorageAvailable();
      setIsStorageAvailable(isAvailable);
      storageCheckRef.current = true;
    };

    checkStorageAvailability();
    
    // Carregar valor inicial do storage - implementado inline para evitar dependência circular
    const loadInitialValue = (): T => {
      try {
        const storage = getAvailableStorage();
        if (!storage) {
          return defaultValue;
        }

        const item = storage.getItem(key);
        if (item === null) {
          return defaultValue;
        }

        // Tentar fazer parse do JSON
        return JSON.parse(item);
      } catch (error) {
        console.error(`Erro ao ler do storage (chave: ${key}):`, error);
        return defaultValue;
      }
    };
    
    const initialValue = loadInitialValue();
    setStoredValue(initialValue);

    // Adicionar listener para mudanças em outras abas/janelas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.error('Erro ao processar mudança no storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, defaultValue, useSessionStorageForced]);

  // Função para atualizar o valor
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      // Usar a forma funcional do setState para evitar dependências externas
      setStoredValue((currentStoredValue) => {
        // Permitir que value seja uma função para ter acesso ao valor anterior
        const valueToStore = value instanceof Function ? value(currentStoredValue) : value;
        
        // Salvar no storage de forma assíncrona para não bloquear o render
        setTimeout(() => {
          setValueToStorage(valueToStore);
        }, 0);
        
        return valueToStore;
      });
    } catch (error) {
      console.error('Erro ao atualizar valor:', error);
    }
  }, [setValueToStorage]);

  return [storedValue, setValue, isStorageAvailable];
}

/**
 * Hook específico para quizzes com auto-save
 */
export function useQuizzesStorage(defaultValue: any[] = []) {
  const [quizzes, setQuizzes, isStorageAvailable] = useLocalStorage('quiz-app-quizzes', defaultValue);
  
  return {
    quizzes,
    setQuizzes,
    isStorageAvailable,
    // Função para adicionar um quiz
    addQuiz: (quiz: any) => {
      setQuizzes(prev => [...prev, quiz]);
    },
    // Função para atualizar um quiz
    updateQuiz: (id: string, updates: Partial<any>) => {
      setQuizzes(prev => prev.map(quiz => 
        quiz.id === id ? { ...quiz, ...updates, updatedAt: Date.now() } : quiz
      ));
    },
    // Função para remover um quiz
    removeQuiz: (id: string) => {
      setQuizzes(prev => prev.filter(quiz => quiz.id !== id));
    },
    // Função para limpar todos os quizzes
    clearQuizzes: () => {
      setQuizzes([]);
    }
  };
}

/**
 * Hook para detectar mudanças no storage e sincronizar entre abas
 */
export function useStorageSync(key: string, callback: (value: any) => void) {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          callback(newValue);
        } catch (error) {
          console.error('Erro ao sincronizar storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, callback]);
}
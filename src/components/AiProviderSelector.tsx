import React from 'react';
import type { AiProvider } from '../types/settings';

interface AiProviderSelectorProps {
  label: string;
  value: AiProvider;
  onChange: (provider: AiProvider) => void;
  disabled?: boolean;
}

const AiProviderSelector: React.FC<AiProviderSelectorProps> = ({
  label,
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name={`${label.toLowerCase().replace(/\s+/g, '-')}-provider`}
              value="pollinations"
              checked={value === 'pollinations'}
              onChange={() => onChange('pollinations')}
              disabled={disabled}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
            />
            <span className="text-sm text-gray-700">Pollinations</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name={`${label.toLowerCase().replace(/\s+/g, '-')}-provider`}
              value="huggingface"
              checked={value === 'huggingface'}
              onChange={() => onChange('huggingface')}
              disabled={disabled}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
            />
            <span className="text-sm text-gray-700">Hugging Face</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name={`${label.toLowerCase().replace(/\s+/g, '-')}-provider`}
              value="mistral"
              checked={value === 'mistral'}
              onChange={() => onChange('mistral')}
              disabled={disabled}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
            />
            <span className="text-sm text-gray-700">Mistral</span>
          </label>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {value === 'pollinations' ? (
          <span>Sem necessidade de chave de API. Gratuito com limites públicos.</span>
        ) : value === 'huggingface' ? (
          <span>Requer token gratuito do Hugging Face. Boa qualidade.</span>
        ) : (
          <span>Requer chave de API do Mistral. Alta qualidade e performance.</span>
        )}
      </div>
    </div>
  );
};

export default AiProviderSelector;
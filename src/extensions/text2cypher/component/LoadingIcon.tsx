import React from 'react';
import openAiLogo from '../clients/OpenAi/OpenAiLogo.png';
import flowLogo from '../clients/Flow/FlowLogo.svg';

interface ProviderConfig {
  logo: string;
  text: string;
}

const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
  OpenAI: {
    logo: openAiLogo,
    text: 'Calling OpenAI...',
  },
  AzureOpenAI: {
    logo: openAiLogo,
    text: 'Calling Azure OpenAI...',
  },
  'CI&T Flow': {
    logo: flowLogo,
    text: 'Calling CI&T Flow...',
  },
};

const DEFAULT_CONFIG: ProviderConfig = {
  logo: openAiLogo,
  text: 'Calling OpenAI...',
};

export const LoadingIcon = ({ provider }: { provider?: string }) => {
  const config = provider && PROVIDER_CONFIG[provider] ? PROVIDER_CONFIG[provider] : DEFAULT_CONFIG;

  return (
    <div className='centered' style={{ textAlign: 'center' }}>
      <br />
      <img
        style={{ width: 40, animation: 'pulse 2s infinite', marginTop: 'auto', marginLeft: 'auto', marginRight: 'auto' }}
        src={config.logo}
      />
      <br />
      <span style={{ fontSize: 12 }}>{config.text}</span>
    </div>
  );
};

// Keep the legacy export for backwards compatibility
export const GPT_LOADING_ICON = <LoadingIcon />;

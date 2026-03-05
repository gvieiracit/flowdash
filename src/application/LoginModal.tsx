import React, { useState } from 'react';
import { Button, TextInput } from '@neo4j-ndl/react';

// SHA-256 using Web Crypto API
const sha256 = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

interface LoginModalProps {
  authAllowedDomains: string[];
  onLogin: (email: string, password: string) => void;
  error: string;
  loading: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ authAllowedDomains, onLogin, error, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    // Validate email domain
    const domain = email.split('@')[1].toLowerCase();
    if (!authAllowedDomains.includes(domain)) {
      setValidationError(`Only ${authAllowedDomains.map((d) => `@${d}`).join(' and ')} emails are allowed.`);
      return;
    }

    onLogin(email.toLowerCase(), password);
  };

  const displayError = validationError || error;

  return (
    <div
      className='n-bg-palette-neutral-bg-default'
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh' }}
    >
      <div className='n-w-96 n-p-8 n-rounded-lg n-shadow-lg n-bg-palette-neutral-bg-weak' style={{ textAlign: 'center' }}>
        <div className='n-mb-6'>
          <img src='ciandt-flow-logo.svg' alt='FlowDash' style={{ height: 32, display: 'block', margin: '10px 0px 10px 98px' }} />
          <p className='n-text-sm n-text-palette-neutral-text-weak'>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='n-mb-4'>
            <TextInput
              label='Email'
              placeholder='your.login@company.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              fluid
            />
          </div>
          <div className='n-mb-4'>
            <TextInput
              label='Password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fluid
            />
          </div>

          {displayError && (
            <div className='n-mb-4 n-text-sm' style={{ color: '#dc2626', textAlign: 'center' }}>
              {displayError}
            </div>
          )}

          <Button
            type='submit'
            fill='filled'
            color='primary'
            loading={loading}
            disabled={loading || !email || !password}
            className='n-w-full'
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
};

export { sha256 };
export default LoginModal;

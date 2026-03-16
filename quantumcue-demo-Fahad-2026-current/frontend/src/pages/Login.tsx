/**
 * Login page component with new design system.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/brand/Logo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { TopBar } from '../components/layout/TopBar';
import { forgotPassword } from '../api/endpoints/auth';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { EmailSentModal } from '../components/auth/EmailSentModal';

export const Login: React.FC = () => {
  /* Existing code */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isEmailSentOpen, setIsEmailSentOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const { login, isAuthenticated, user, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      const fromState = (location.state as { from?: string })?.from;
      let targetPath = fromState;

      if (!targetPath) {
        if (user.role === 'admin' || user.role === 'superadmin') {
          targetPath = '/admin';
        } else {
          targetPath = '/dashboard';
        }
      }

      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }

    try {
      await login({ email, password });
    } catch (err) {
    }
  };

  const handleSendRecoveryEmail = async (email: string) => {
    try {
      await forgotPassword({ email });
      setRecoveryEmail(email);
      setIsForgotPasswordOpen(false);
      setIsEmailSentOpen(true);
    } catch (err) {
      throw err;
    }
  };

  const displayError = formError || error;

  return (
    <div className="min-h-screen bg-grey-50 dark:bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 dark:bg-navy-700/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 dark:bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo above card */}
        <div className="flex flex-col items-center justify-center mb-2">
          <Logo variant="full-with-tagline" size="xl" />
        </div>

        {/* Login Card */}
        <Card className="w-full p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-grey-900 dark:text-text-primary">Welcome back</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {displayError && (
              <div className="p-3 bg-red-500 border border-red-500 rounded-lg">
                <p className="text-sm text-white">{displayError}</p>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@quantumcue.demo"
              autoComplete="email"
              disabled={isLoading}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isLoading}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Sign in
            </Button>
          </form>

          {/* Access code Link */}
          <div className="mt-6 flex flex-row text-center justify-between">
            <a
              href="/signup"
              className="text-navy-700 hover:underline hover:text-navy-800 dark:text-navy-600 transition-colors font-medium"
            >
              Enter Invite Code
            </a>
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-navy-700 hover:underline hover:text-navy-800 dark:text-navy-600 transition-colors font-medium bg-transparent border-none p-0 cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSendEmail={handleSendRecoveryEmail}
      />

      <EmailSentModal
        isOpen={isEmailSentOpen}
        onClose={() => setIsEmailSentOpen(false)}
        email={recoveryEmail}
      />
    </div>
  );
};

export default Login;

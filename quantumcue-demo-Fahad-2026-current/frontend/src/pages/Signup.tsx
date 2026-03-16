/**
 * Signup page component with new design system.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/brand/Logo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { TopBar } from '../components/layout/TopBar';

export const Signup: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const accessCode = sessionStorage.getItem('accessCode');

  const { signup, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    } else if (!accessCode) {
      navigate('/invite', { replace: true });
    }
  }, [isAuthenticated, accessCode, navigate]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const validateEmail = (email: string): boolean => {
    // Loose email validation - just check for @ and basic format
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!firstName || !lastName || !email || !company || !password || !confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    try {
      await signup({
        first_name: firstName,
        last_name: lastName,
        email,
        company,
        password,
        access_code: accessCode || '',
      });
      // Navigation happens automatically via useEffect when isAuthenticated becomes true
    } catch (err) {
      // Error is handled by the store
    }
  };

  const displayError = formError || error;
  const isDuplicateEmailError =
    typeof displayError === 'string' &&
    /already registered|already exists/i.test(displayError);

  return (
    <div className="min-h-screen bg-grey-50 dark:bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-navy-100 dark:bg-navy-700/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-100 dark:bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center justify-center mb-2">
          <Logo variant="full-with-tagline" size="xl" />
        </div>

        <Card className="w-full p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-grey-900 dark:text-text-primary">Create your account</h1>
            <p className="text-grey-500 dark:text-text-secondary mt-1">
              Get started with QuantumCue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {displayError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-700">
                  <p>{displayError}</p>
                  {isDuplicateEmailError && (
                    <p className="mt-2">
                      <Link to="/login" className="underline font-medium text-red-800 hover:text-red-900">
                        Sign in
                      </Link>{' '}
                      instead.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                name="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                autoComplete="given-name"
                disabled={isLoading}
              />
              <Input
                label="Last Name"
                type="text"
                name="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                autoComplete="family-name"
                disabled={isLoading}
              />
            </div>

            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@company.com"
              autoComplete="email"
              disabled={isLoading}
            />

            <Input
              label="Company"
              type="text"
              name="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
              autoComplete="organization"
              disabled={isLoading}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              disabled={isLoading}
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              autoComplete="new-password"
              disabled={isLoading}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Create account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-grey-500 dark:text-text-tertiary">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-navy-700 hover:text-navy-800 dark:text-navy-600 transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Signup;

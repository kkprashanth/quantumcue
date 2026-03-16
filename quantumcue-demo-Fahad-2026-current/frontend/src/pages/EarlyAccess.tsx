import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/brand/Logo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { TopBar } from '../components/layout/TopBar';

export const EarlyAccess: React.FC = () => {
    const [accessCode, setAccessCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!accessCode.trim()) {
            setError('Please enter an early access code');
            return;
        }

        setIsLoading(true);

        try {
            const { validateCode } = await import('../api/endpoints/auth');
            await validateCode(accessCode.trim());
            sessionStorage.setItem('accessCode', accessCode.trim());
            navigate(`/signup`);
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Invalid access code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-grey-50 dark:bg-background flex flex-col items-center justify-center p-4 relative">

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-navy-100 dark:bg-navy-700/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-100 dark:bg-cyan-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="flex flex-col items-center justify-center mb-6">
                    <Logo variant="full-with-tagline" size="xl" />
                </div>

                <Card className="w-full p-8 shadow-xl border-navy-100 dark:border-navy-800">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-grey-900 dark:text-text-primary mb-2">Invite Code</h1>
                        <p className="text-grey-500 dark:text-text-secondary">
                            Enter your access code to enter the platform.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500 border border-red-50 rounded-lg animate-in fade-in slide-in-from-top-1">
                                <p className="text-sm text-white text-center font-medium">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Input
                                label="Access Code"
                                type="text"
                                name="accessCode"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                placeholder="Enter invite code"
                                autoComplete="off"
                                disabled={isLoading}
                                className="text-center text-lg"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            isLoading={isLoading}
                        >
                            {isLoading ? 'Verifying...' : 'Sign Up'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-grey-500 dark:text-text-tertiary">
                            Already have an account?{' '}
                            <a
                                href="/login"
                                className="text-navy-700 hover:text-navy-800 dark:text-navy-600 transition-colors font-medium"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate('/login');
                                }}
                            >
                                Sign in
                            </a>
                        </p>
                    </div>



                    <div className="mt-8 text-center">
                        <p className="text-xs text-grey-400 dark:text-grey-600">
                            © 2026 QuantumCue. All rights reserved.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default EarlyAccess;

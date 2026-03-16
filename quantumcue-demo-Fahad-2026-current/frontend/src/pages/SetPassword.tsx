/**
 * Set Password page component.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Logo } from '../components/brand/Logo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { toast } from 'sonner';
import { PasswordSetSuccessModal } from '../components/auth/PasswordSetSuccessModal';
import { resetPassword } from '../api/endpoints/auth';

export const SetPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Detailed error states
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
    const [generalError, setGeneralError] = useState<string | null>(null);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();

    // Real-time validation
    useEffect(() => {
        if (password && password.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
        } else {
            setPasswordError(null);
        }
    }, [password]);

    useEffect(() => {
        if (confirmPassword && password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
        } else {
            setConfirmPasswordError(null);
        }
    }, [password, confirmPassword]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);

        // Final validation check
        let isValid = true;
        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            isValid = false;
        }
        if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            isValid = false;
        }

        if (!isValid) return;

        if (!token) {
            setGeneralError('Invalid reset link. Please try requesting a new one.');
            return;
        }

        setIsLoading(true);

        try {
            await resetPassword({ token, new_password: password });
            setShowSuccessModal(true);
        } catch (err: any) {
            console.error(err);
            setGeneralError(err.response?.data?.detail || 'Failed to set password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-grey-50 dark:bg-background flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-navy-100 dark:bg-navy-700/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-100 dark:bg-cyan-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo above card */}
                <div className="flex flex-col items-center justify-center mb-2">
                    <Logo variant="full-with-tagline" size="xl" />
                </div>

                {/* Set Password Card */}
                <Card className="w-full p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-grey-900 dark:text-text-primary">Set New Password</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center justify-center">
                        {generalError && (
                            <div className="p-3 bg-red-500 border border-red-500 rounded-lg w-full">
                                <p className="text-sm text-white text-center">{generalError}</p>
                            </div>
                        )}

                        <Input
                            label="New Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            disabled={isLoading}
                            error={passwordError || undefined}
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            disabled={isLoading}
                            error={confirmPasswordError || undefined}
                        />

                        <Button
                            type="submit"
                            className="w-[90%]"
                            size="lg"
                            isLoading={isLoading}
                            disabled={!!passwordError || !!confirmPasswordError || !password || !confirmPassword}
                        >
                            Set Password
                        </Button>
                    </form>
                </Card>
            </div>

            <PasswordSetSuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
            />
        </div>
    );
};

export default SetPassword;

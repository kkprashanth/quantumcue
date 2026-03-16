import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Modal, ModalActions } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSendEmail: (email: string) => Promise<void> | void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
    isOpen,
    onClose,
    onSendEmail,
}) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address');
            return;
        }
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setError(null);
        setIsLoading(true);
        try {
            await onSendEmail(email);
        } catch (err) {
            setError("Failed to send email. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            showCloseButton={true}
            isTitleBordered={false}
        >
            <div className="flex flex-col items-center pt-8 pb-4">
                <div className="w-16 h-16 mb-6 bg-gradient-quantum rounded-2xl flex items-center justify-center shadow-quantum transform rotate-3 hover:rotate-0 transition-transform duration-slow">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Mail className="w-7 h-7 text-white" />
                    </div>
                </div>

                <div className="text-center px-4 mb-8">
                    <h2 className="text-2xl font-bold text-grey-900 dark:text-text-primary mb-2">
                        Reset Password
                    </h2>
                    <p className="text-grey-600 dark:text-text-secondary">
                        Enter your email address and we'll send you a link to reset your password.
                    </p >
                </div >

                <form onSubmit={handleSubmit} className="w-full px-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-error/10 border border-red-200 dark:border-error/20 rounded-xl animate-in fade-in slide-in-from-top-1 duration-normal">
                            <p className="text-sm text-red-600 dark:text-error text-center font-medium">{error}</p>
                        </div>
                    )}

                    <div className="space-y-1">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (error) setError(null);
                            }}
                            autoFocus
                            icon={<Mail className="w-4 h-4 text-grey-400" />}
                            className="bg-grey-50/50 dark:bg-surface-elevated/50 border-grey-200 dark:border-border hover:border-navy-900 dark:hover:border-navy-700 transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <Button
                            type="submit"
                            variant="quantum"
                            size="lg"
                            className="w-full shadow-lg"
                            isLoading={isLoading}
                        >
                            Send Reset Link
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            type="button"
                            className="w-full text-grey-500 hover:text-grey-900 dark:hover:text-text-primary"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div >
        </Modal >
    );
};

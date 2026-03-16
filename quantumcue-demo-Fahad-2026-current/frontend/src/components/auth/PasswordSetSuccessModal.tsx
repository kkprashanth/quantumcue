import React, { useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface PasswordSetSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    autoRedirectDelay?: number;
}

export const PasswordSetSuccessModal: React.FC<PasswordSetSuccessModalProps> = ({
    isOpen,
    onClose,
    autoRedirectDelay = 3000,
}) => {
    const navigate = useNavigate();

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (isOpen) {
            timeout = setTimeout(() => {
                onClose();
                window.location.replace('/login');
            }, autoRedirectDelay);
        }
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [isOpen, onClose, navigate, autoRedirectDelay]);

    const handleContinue = () => {
        onClose();
        navigate('/login');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false}
            size="sm"
        >
            <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="w-20 h-20 mb-6 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                    <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                            className="animate-[draw_0.6s_ease-out_forwards]"
                            strokeDasharray="100"
                            strokeDashoffset="100"
                        />

                        <style>{`
                @keyframes draw {
                    to {
                        stroke-dashoffset: 0;
                    }
                }
            `}</style>
                    </svg>
                </div>

                <h3 className="text-xl font-bold text-grey-900 dark:text-text-primary mb-2">
                    Password Set Successfully!
                </h3>

                <p className="text-grey-600 dark:text-text-secondary mb-6">
                    Your password has been updated. You will be redirected to the login page shortly.
                </p>

                <Button
                    className="w-full"
                    onClick={handleContinue}
                >
                    Continue to Login
                </Button>
            </div>
        </Modal>
    );
};

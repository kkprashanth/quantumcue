import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface EmailSentModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
}

export const EmailSentModal: React.FC<EmailSentModalProps> = ({
    isOpen,
    onClose,
    email,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={true}
            size="sm"
        >
            <div className="flex flex-col items-center pt-8 pb-4">
                <div className="w-16 h-16 mb-6 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 transform -rotate-3 hover:rotate-0 transition-transform duration-slow">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <svg
                            className="w-8 h-8 text-white"
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
                </div>

                <div className="text-center px-4 mb-8">
                    <h3 className="text-2xl font-bold text-grey-900 dark:text-text-primary mb-2">
                        Email Sent!
                    </h3>
                    <p className="text-grey-600 dark:text-text-secondary leading-relaxed">
                        We've sent a password reset link to <br />
                        <span className="font-semibold text-navy-900 dark:text-navy-400">{email}</span>
                    </p>
                </div>

                <div className="w-full px-6">
                    <Button
                        className="w-full shadow-md"
                        variant="quantum"
                        size="lg"
                        onClick={onClose}
                    >
                        Got it, thanks
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

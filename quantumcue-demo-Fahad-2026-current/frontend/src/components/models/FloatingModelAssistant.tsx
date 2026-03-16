/**
 * Floating Model Assistant Component
 * Modern compact ChatGPT-style assistant
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
    Sparkles,
    X,
    Send,
    Loader2,
    Lightbulb,
    ArrowRight,
    Minimize2,
    Maximize2,
    MessageSquare,
} from 'lucide-react';
import { useModelChat } from '../../hooks/useModels';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    insights?: string[];
    recommendations?: string[];
}

const SUGGESTED_QUESTIONS = [
    "What's this model's purpose?",
    'How can I improve it?',
    'Analyze my interactions',
    'Explain reinforcement learning',
];

export const FloatingModelAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');

    const location = useLocation();
    const chatMutation = useModelChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [modelId, setModelId] = useState<string | null>(null);

    useEffect(() => {
        const match = location.pathname.match(/\/models\/([a-zA-Z0-9-]+)/);
        setModelId(match && match[1] ? match[1] : null);
    }, [location.pathname]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, chatMutation.isPending]);

    if (!location.pathname.startsWith('/models')) return null;

    const handleSend = async (content: string) => {
        if (!content.trim() || chatMutation.isPending || !modelId) return;

        const userMessage: ChatMessage = { role: 'user', content };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        chatMutation.reset();

        try {
            const response = await chatMutation.mutateAsync({
                modelId,
                message: content,
            });

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.message,
                insights: response.insights || undefined,
                recommendations: response.recommendations || undefined,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Something went wrong. Try again.' },
            ]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(input);
        }
    };

    const isLoading = chatMutation.isPending;

    return (
        <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end">
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex h-14 w-14 items-center justify-center rounded-full 
                     bg-white dark:bg-surface shadow-xl 
                     hover:shadow-3xl hover:-translate-y-1
                     border-2
                     transition-all duration-300"
                >
                    <img src="/quantumcue_icon.svg" className="w-6 h-6" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`
            bg-white dark:bg-surface
            border border-grey-200 dark:border-border
            shadow-2xl
            rounded-2xl
            flex flex-col overflow-hidden
            transition-all duration-300
            ${isMaximized
                            ? 'fixed inset-6 lg:w-[600px] lg:left-auto'
                            : 'w-[380px] h-[560px]'}
          `}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 
                          bg-white dark:bg-surface 
                          border-b border-grey-200 dark:border-border">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <img
                                    src="/quantumcue_icon.svg"
                                    alt="QuantumCue"
                                    className="w-5 h-5"
                                />
                                <h3 className="text-sm font-semibold">
                                    QuantumCue Assistant
                                </h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsMaximized(!isMaximized)}
                                className="p-1.5 rounded-md hover:bg-grey-100"
                            >
                                {isMaximized ? (
                                    <Minimize2 className="w-4 h-4" />
                                ) : (
                                    <Maximize2 className="w-4 h-4" />
                                )}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-md hover:bg-grey-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-grey-50/40 dark:bg-background/40">
                        {!modelId ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <MessageSquare className="w-8 h-8 text-grey-400 mb-3" />
                                <p className="text-sm text-grey-500">
                                    Navigate to a model page to start chatting.
                                </p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="space-y-2">
                                {SUGGESTED_QUESTIONS.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(q)}
                                        className="
        w-full text-left text-sm px-4 py-2.5
        rounded-xl
        bg-white dark:bg-surface
        border border-grey-200 dark:border-border
        hover:bg-grey-100 dark:hover:bg-background
        hover:-translate-y-0.5
        transition-all duration-200
      "
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`animate-message flex ${message.role === 'user'
                                        ? 'justify-end'
                                        : 'justify-start'
                                        }`}
                                >
                                    <div
                                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${message.role === 'user'
                                            ? 'bg-[#3850A0] text-white'
                                            : 'bg-white border border-grey-200'
                                            }`}
                                    >
                                        {message.content}
                                    </div>
                                </div>
                            ))
                        )}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-grey-200 rounded-2xl px-4 py-2.5 shadow-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* COMPACT MODERN INPUT */}
                    <div className="p-3 bg-white border-t border-grey-200">
                        <div
                            className={`
                flex items-center gap-2
                px-3 h-12
                rounded-xl
                border-2
                bg-white
                transition-all duration-200
                ${modelId
                                    ? 'border-grey-300 focus-within:border-[#3850A0] focus-within:shadow-md'
                                    : 'border-grey-200 opacity-60'
                                }
              `}
                        >
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask something..."
                                rows={1}
                                className="
    flex-1 resize-none bg-transparent text-sm leading-relaxed
    outline-none focus:outline-none
    ring-0 focus:ring-0
    border-0
    focus:border-0
    shadow-none focus:shadow-none
  "
                            />

                            <button
                                onClick={() => handleSend(input)}
                                disabled={!input.trim() || !modelId || isLoading}
                                className={`
                  flex items-center justify-center
                  h-8 w-8 rounded-lg
                  transition-all duration-200
                  ${input.trim() && modelId
                                        ? 'bg-[#3850A0] text-white hover:scale-105 active:scale-95'
                                        : 'bg-grey-100 text-grey-400 cursor-not-allowed'
                                    }
                `}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloatingModelAssistant;
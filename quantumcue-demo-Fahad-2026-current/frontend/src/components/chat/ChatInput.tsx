/**
 * Chat input component.
 */

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export const ChatInput = ({
  onSend,
  disabled = false,
  isLoading = false,
  placeholder = 'Type your message...',
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled && !isLoading) {
      onSend(trimmed);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-3 p-4 border-t border-grey-200 dark:border-border bg-grey-50 dark:bg-background">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        rows={1}
        className="
          flex-1 resize-none
          bg-white dark:bg-surface border border-grey-200 dark:border-border rounded-lg
          px-4 py-3 text-grey-900 dark:text-text-primary placeholder:text-grey-400 dark:placeholder:text-text-tertiary
          focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      />
      <button
        onClick={handleSubmit}
        disabled={!message.trim() || disabled || isLoading}
        className="
          p-3 rounded-xl
          bg-navy-700 text-white
          hover:bg-navy-800
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
        aria-label="Send message"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default ChatInput;

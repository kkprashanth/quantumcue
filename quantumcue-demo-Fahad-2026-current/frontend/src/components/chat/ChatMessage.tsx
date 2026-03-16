/**
 * Chat message component.
 */

import { Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface ChatMessageProps {
  message: ChatMessageData;
  isStreaming?: boolean;
}

export const ChatMessage = ({ message, isStreaming = false }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-navy-700/20 flex items-center justify-center mt-1">
          <Sparkles className="w-4 h-4 text-navy-700" />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`
          max-w-[85%] rounded-xl px-4 py-3
          bg-white dark:bg-surface border-2 border-grey-300 dark:border-border
          text-grey-900 dark:text-text-primary
          ${isUser ? 'rounded-tr-sm border-navy-300 dark:border-navy-600' : 'rounded-tl-sm border-grey-300 dark:border-border'}
          ${isStreaming ? 'animate-pulse' : ''}
        `}
      >
        {isUser && (
          <div className="text-xs font-medium mb-1.5 text-grey-700 dark:text-text-secondary">You</div>
        )}
        {!isUser && (
          <div className="text-xs font-medium mb-1.5 text-grey-700 dark:text-text-secondary flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Assistant
          </div>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed text-grey-900 dark:text-text-primary">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 text-grey-900 dark:text-text-primary leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="mb-1 text-grey-700 dark:text-text-secondary">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-grey-900 dark:text-text-primary">{children}</strong>,
                code: ({ children }) => (
                  <code className="bg-grey-100 dark:bg-surface-elevated px-1 py-0.5 rounded text-navy-700 text-xs">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-grey-100 dark:bg-surface-elevated p-3 rounded-lg overflow-x-auto my-2 text-grey-900 dark:text-text-primary">
                    {children}
                  </pre>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs mt-2 opacity-60 text-grey-500 dark:text-text-tertiary">
          {new Date(message.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-grey-100 dark:bg-surface-elevated border-2 border-grey-300 dark:border-border flex items-center justify-center mt-1">
          <span className="text-grey-700 dark:text-text-secondary text-xs font-medium">You</span>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;

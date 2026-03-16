/**
 * Main chat container component.
 */

import { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatMessage, type ChatMessageData } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatSuggestions } from './ChatSuggestions';
import { TypingIndicator } from './TypingIndicator';

interface ChatContainerProps {
  messages: ChatMessageData[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingContent?: string;
  disabled?: boolean;
  showSuggestions?: boolean;
}

export const ChatContainer = ({
  messages,
  onSendMessage,
  isLoading = false,
  isStreaming = false,
  streamingContent = '',
  disabled = false,
  showSuggestions = true,
}: ChatContainerProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-grey-50 dark:bg-background rounded-xl border border-grey-200 dark:border-border overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-navy-700/20 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-navy-700" />
            </div>
            <h3 className="text-lg font-medium text-grey-900 dark:text-text-primary mb-2">
              Start a Conversation
            </h3>
            <p className="text-grey-600 dark:text-text-secondary max-w-md mb-6">
              I'm your quantum computing assistant. Tell me about your problem,
              and I'll help you configure the right job settings.
            </p>
            {showSuggestions && (
              <ChatSuggestions onSelect={onSendMessage} />
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Streaming message */}
            {isStreaming && streamingContent && (
              <ChatMessage
                message={{
                  id: 'streaming',
                  role: 'assistant',
                  content: streamingContent,
                  created_at: new Date().toISOString(),
                }}
                isStreaming
              />
            )}

            {/* Typing indicator */}
            {isLoading && !isStreaming && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <ChatInput
        onSend={onSendMessage}
        isLoading={isLoading || isStreaming}
        disabled={disabled}
        placeholder="Describe your quantum computing problem..."
      />
    </div>
  );
};

export default ChatContainer;

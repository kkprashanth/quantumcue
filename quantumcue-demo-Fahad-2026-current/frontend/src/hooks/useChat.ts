/**
 * Chat hooks using React Query.
 */

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getChatHistory,
  sendChatMessage,
  streamChatMessage,
  type ChatMessage,
  type ChatHistoryResponse,
  type JobConfigSuggestion,
} from '../api/endpoints/chat';

/**
 * Hook to fetch chat history.
 */
export const useChatHistory = (jobId: string | undefined) => {
  return useQuery<ChatHistoryResponse, Error>({
    queryKey: ['chat', jobId],
    queryFn: () => getChatHistory(jobId!),
    enabled: !!jobId,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to send chat messages (non-streaming).
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, content }: { jobId: string; content: string }) =>
      sendChatMessage(jobId, content),
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat', jobId] });
    },
  });
};

/**
 * Hook for managing chat state with streaming support.
 */
export const useChat = (jobId: string | undefined) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [lastSuggestion, setLastSuggestion] = useState<JobConfigSuggestion | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  // Load initial chat history
  const { data: historyData, isLoading: isLoadingHistory } = useChatHistory(jobId);

  // Sync messages from history
  useState(() => {
    if (historyData?.messages) {
      setMessages(historyData.messages);
    }
  });

  // Update messages when history changes
  if (historyData?.messages && messages.length === 0 && historyData.messages.length > 0) {
    setMessages(historyData.messages);
  }

  /**
   * Send a message with streaming response.
   */
  const sendMessageStreaming = useCallback(async (content: string) => {
    if (!jobId || isLoading || isStreaming) return;

    setError(null);
    setIsLoading(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Start streaming
    setIsLoading(false);
    setIsStreaming(true);
    setStreamingContent('');

    abortControllerRef.current = streamChatMessage(
      jobId,
      content,
      // On chunk
      (chunk) => {
        setStreamingContent((prev) => prev + chunk);
      },
      // On done
      () => {
        setStreamingContent((prev) => {
          // Add the complete assistant message
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: prev,
            created_at: new Date().toISOString(),
          };
          setMessages((msgs) => [...msgs, assistantMessage]);
          return '';
        });
        setIsStreaming(false);
        // Invalidate cache to sync with backend
        queryClient.invalidateQueries({ queryKey: ['chat', jobId] });
      },
      // On error
      (err) => {
        setError(err);
        setIsStreaming(false);
        setStreamingContent('');
      }
    );
  }, [jobId, isLoading, isStreaming, queryClient]);

  /**
   * Send a message without streaming.
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!jobId || isLoading) return;

    setError(null);
    setIsLoading(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await sendChatMessage(jobId, content);
      setMessages((prev) => [...prev, response.message]);

      if (response.suggestion) {
        setLastSuggestion(response.suggestion);
      }
    } catch (err) {
      setError(err as Error);
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [jobId, isLoading]);

  /**
   * Cancel ongoing streaming.
   */
  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, []);

  /**
   * Clear messages.
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastSuggestion(null);
  }, []);

  return {
    messages,
    isLoading: isLoading || isLoadingHistory,
    isStreaming,
    streamingContent,
    lastSuggestion,
    error,
    sendMessage,
    sendMessageStreaming,
    cancelStreaming,
    clearMessages,
  };
};

export default useChat;

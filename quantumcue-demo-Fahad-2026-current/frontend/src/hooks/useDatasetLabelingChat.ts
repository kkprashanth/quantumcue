/**
 * Hook for dataset labeling chat with LLM
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatDatasetLabeling, saveDatasetLabeling, type DatasetLabelingChatResponse, type DatasetLabelingSaveRequest } from '@/api/endpoints/datasetLabeling';
import type { Dataset } from '@/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ExtractedStructure {
  labeling_structure: Record<string, unknown>;
  classifications: string[];
  required_subdirectories: string[];
  file_types: Record<string, string[]>;
  description: string;
}

export const useDatasetLabelingChat = (datasetId: string | null) => {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [extractedStructure, setExtractedStructure] = useState<ExtractedStructure | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const chatMutation = useMutation({
    mutationFn: (message: string) => {
      if (!datasetId) {
        throw new Error('Dataset ID is required');
      }
      return chatDatasetLabeling(datasetId, message);
    },
    onSuccess: (response: DatasetLabelingChatResponse) => {
      // Get the last user message (the one we just sent)
      const lastUserMessage = messages[messages.length - 1];
      const userMessage: ChatMessage = lastUserMessage || {
        id: `user-${Date.now()}`,
        role: 'user',
        content: '',
        created_at: new Date().toISOString(),
      };

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => {
        // If we already added the user message, just add assistant
        if (prev.length > 0 && prev[prev.length - 1].role === 'user' && prev[prev.length - 1].id === userMessage.id) {
          return [...prev, assistantMessage];
        }
        // Otherwise add both
        return [...prev, userMessage, assistantMessage];
      });

      // Update extracted structure if available
      if (response.extracted_structure) {
        setExtractedStructure(response.extracted_structure);
      }

      setIsStreaming(false);
      setStreamingContent('');
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setIsStreaming(false);
      setStreamingContent('');
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: DatasetLabelingSaveRequest) => {
      if (!datasetId) {
        throw new Error('Dataset ID is required');
      }
      return saveDatasetLabeling(datasetId, data);
    },
    onSuccess: () => {
      // Invalidate dataset query to refresh data
      queryClient.invalidateQueries({ queryKey: ['dataset', datasetId] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });

  const sendMessage = useCallback(
    (message: string) => {
      if (!message.trim() || chatMutation.isPending) {
        return;
      }

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Start loading indicator
      setIsStreaming(false); // Not streaming yet, just loading
      setStreamingContent('');

      // Send to API
      chatMutation.mutate(message);
    },
    [chatMutation, messages]
  );

  const saveStructure = useCallback(
    (structure: ExtractedStructure): Promise<void> => {
      if (!structure) {
        return Promise.resolve();
      }

      const saveData: DatasetLabelingSaveRequest = {
        labeling_structure: structure.labeling_structure,
        description: structure.description,
      };

      return new Promise((resolve, reject) => {
        saveMutation.mutate(saveData, {
          onSuccess: () => {
            resolve();
          },
          onError: (error) => {
            reject(error);
          },
        });
      });
    },
    [saveMutation]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setExtractedStructure(null);
    setIsStreaming(false);
    setStreamingContent('');
  }, []);

  return {
    messages,
    extractedStructure,
    isStreaming,
    streamingContent,
    isLoading: chatMutation.isPending,
    isSaving: saveMutation.isPending,
    sendMessage,
    saveStructure,
    resetChat,
    error: chatMutation.error || saveMutation.error,
  };
};


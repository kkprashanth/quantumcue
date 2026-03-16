/**
 * Chat API endpoints.
 */

import apiClient from '../client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface ChatHistoryResponse {
  job_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface JobConfigSuggestion {
  name?: string;
  description?: string;
  job_type?: string;
  provider_id?: string;
  priority?: string;
  shot_count?: number;
  optimization_level?: number;
  qubit_count_requested?: number;
  parameters?: Record<string, unknown>;
  confidence?: number;
  reasoning?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  suggestion?: JobConfigSuggestion;
}

/**
 * Get chat history for a job.
 */
export const getChatHistory = async (jobId: string): Promise<ChatHistoryResponse> => {
  const response = await apiClient.get<ChatHistoryResponse>(`/jobs/${jobId}/chat`);
  return response.data;
};

/**
 * Send a chat message.
 */
export const sendChatMessage = async (
  jobId: string,
  content: string
): Promise<ChatResponse> => {
  const response = await apiClient.post<ChatResponse>(`/jobs/${jobId}/chat`, {
    content,
  });
  return response.data;
};

/**
 * Stream a chat message response.
 * Returns an EventSource for server-sent events.
 */
export const streamChatMessage = (
  jobId: string,
  content: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): AbortController => {
  const controller = new AbortController();

  const fetchStream = async () => {
    try {
      const response = await fetch(`/api/v1/jobs/${jobId}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ content }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                onError(new Error(data.error));
                return;
              }
              if (data.done) {
                onDone();
                return;
              }
              if (data.content) {
                onChunk(data.content);
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      onDone();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        onError(error as Error);
      }
    }
  };

  fetchStream();
  return controller;
};

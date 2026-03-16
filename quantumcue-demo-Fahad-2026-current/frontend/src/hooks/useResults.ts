/**
 * Results hooks using React Query.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getJobResults,
  chatWithResults,
  type JobResultResponse,
  type ResultChatResponse,
} from '../api/endpoints/results';

/**
 * Hook to fetch job results.
 */
export const useJobResults = (jobId: string | undefined) => {
  return useQuery<JobResultResponse, Error>({
    queryKey: ['results', jobId],
    queryFn: () => getJobResults(jobId!),
    enabled: !!jobId,
    staleTime: 60 * 1000, // Results don't change frequently
    retry: (failureCount, error) => {
      // Don't retry on 400 errors (job not complete)
      if (error.message.includes('400')) return false;
      return failureCount < 3;
    },
  });
};

/**
 * Hook to chat with results assistant.
 */
export const useResultsChat = () => {
  return useMutation<ResultChatResponse, Error, { jobId: string; content: string }>({
    mutationFn: ({ jobId, content }) => chatWithResults(jobId, content),
  });
};

export default useJobResults;

/**
 * Job creation page with chat interface.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { ChatContainer, type ChatMessageData } from '../../components/chat';
import { JobConfigPanel, type JobConfig } from '../../components/jobs';
import { Button } from '../../components/ui/Button';
import { useChat } from '../../hooks/useChat';
import { useProviders } from '../../hooks/useProviders';
import { useCreateJob, useSubmitJob } from '../../hooks/useJobs';
import type { JobType, JobPriority } from '../../api/endpoints/jobs';

const DEFAULT_CONFIG: JobConfig = {
  name: '',
  description: '',
  job_type: 'optimization' as JobType,
  provider_id: '',
  priority: 'normal' as JobPriority,
  shot_count: 1000,
  optimization_level: 1,
  qubit_count_requested: null,
  parameters: {},
};

export const JobCreate = () => {
  const navigate = useNavigate();
  const [jobId, setJobId] = useState<string | null>(null);
  const [config, setConfig] = useState<JobConfig>(DEFAULT_CONFIG);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { data: providersData } = useProviders();
  const createJob = useCreateJob();
  const submitJob = useSubmitJob();

  const {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    lastSuggestion,
    error: chatError,
    sendMessage,
  } = useChat(jobId || undefined);

  // Create a draft job on mount
  useEffect(() => {
    const createDraftJob = async () => {
      try {
        const job = await createJob.mutateAsync({
          name: 'New Quantum Job',
          job_type: 'optimization',
        });
        setJobId(job.id);
        setConfig({
          ...DEFAULT_CONFIG,
          name: job.name,
        });
      } catch (err) {
        console.error('Failed to create draft job:', err);
      }
    };

    if (!jobId) {
      createDraftJob();
    }
  }, []);

  // Apply suggestions from chat
  useEffect(() => {
    if (lastSuggestion) {
      setConfig((prev) => ({
        ...prev,
        ...(lastSuggestion.name && { name: lastSuggestion.name }),
        ...(lastSuggestion.description && { description: lastSuggestion.description }),
        ...(lastSuggestion.job_type && { job_type: lastSuggestion.job_type as JobType }),
        ...(lastSuggestion.provider_id && { provider_id: lastSuggestion.provider_id }),
        ...(lastSuggestion.priority && { priority: lastSuggestion.priority as JobPriority }),
        ...(lastSuggestion.shot_count && { shot_count: lastSuggestion.shot_count }),
        ...(lastSuggestion.optimization_level !== undefined && {
          optimization_level: lastSuggestion.optimization_level,
        }),
        ...(lastSuggestion.qubit_count_requested && {
          qubit_count_requested: lastSuggestion.qubit_count_requested,
        }),
        ...(lastSuggestion.parameters && { parameters: lastSuggestion.parameters }),
      }));
    }
  }, [lastSuggestion]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const handleSave = async () => {
    if (!jobId || !config.name.trim()) return;

    setSaveStatus('saving');
    try {
      // For now, just navigate - actual update would happen via API
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleSubmit = async () => {
    if (!jobId || !config.provider_id) return;

    try {
      await submitJob.mutateAsync(jobId);
      navigate(`/jobs/${jobId}`);
    } catch (err) {
      console.error('Failed to submit job:', err);
    }
  };

  const providers = providersData?.providers.map((p) => ({ id: p.id, name: p.name })) || [];
  const canSubmit = config.name.trim() && config.provider_id;

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/jobs')}
            className="p-2 rounded-lg hover:bg-background-tertiary text-text-tertiary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Create New Job</h1>
            <p className="text-text-secondary">
              Describe your problem and I'll help you configure the right settings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-status-success text-sm">
              <CheckCircle className="w-4 h-4" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-status-error text-sm">
              <AlertCircle className="w-4 h-4" />
              Save failed
            </span>
          )}
          <Button
            variant="secondary"
            onClick={handleSave}
            isLoading={saveStatus === 'saving'}
            disabled={!config.name.trim()}
          >
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={submitJob.isPending}
            disabled={!canSubmit}
            className="!bg-status-success !hover:bg-status-success/90"
          >
            <Play className="w-4 h-4" />
            Submit Job
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chat Section */}
        <div className="lg:col-span-2 min-h-0">
          <ChatContainer
            messages={messages as ChatMessageData[]}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            disabled={!jobId}
          />
        </div>

        {/* Config Panel */}
        <div className="space-y-4 overflow-y-auto">
          <JobConfigPanel
            config={config}
            onChange={setConfig}
            providers={providers}
            disabled={!jobId}
          />

          {/* Validation Messages */}
          {!config.provider_id && (
            <div className="bg-status-warning/10 border border-status-warning/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary">
                  Select a provider before submitting the job.
                </p>
              </div>
            </div>
          )}

          {chatError && (
            <div className="bg-status-error/10 border border-status-error/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-status-error flex-shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary">
                  {chatError.message}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default JobCreate;

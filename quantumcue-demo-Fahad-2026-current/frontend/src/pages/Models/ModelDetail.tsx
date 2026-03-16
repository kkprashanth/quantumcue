import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Brain, Zap, Activity, Calendar, User, Link as LinkIcon,
  Eye, EyeOff, Copy, Check, Settings, Database, Package, BarChart3,
  Server, Cpu, BookOpen, Hash,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ModelMetrics } from '@/components/models';
import { ModelInferenceUpload } from '@/components/models/ModelInferenceUpload';
import { ModelInteractionHistory } from '@/components/models/ModelInteractionHistory';
import ModelCompare from './ModelCompare';
import { ModelStats } from '@/components/models/ModelStats';
import { RecommendationsConfig } from '@/components/models/RecommendationsConfig';
import { useModel, useModelInteractions, useHostModel, useUpdateModelReasoning, useModelStats } from '@/hooks/useModels';
import { useJob } from '@/hooks/useJobs';
import { useProviderConfiguration, useProviderConfigurationDefaults } from '@/hooks/useProviderConfiguration';
import { useDataset } from '@/hooks/useDatasets';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { AddClassificationsModal } from '@/components/models/AddClassificationsModal';
import { useState, useMemo, useEffect } from 'react';
import type { ProviderConfigurationField } from '@/types';
import Joyride, { Step } from 'react-joyride';
import { getExternalJobResult } from '@/api/endpoints/jobs';

export const ModelDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { data: model, isLoading, error } = useModel(id || null);
  const { data: stats } = useModelStats(id || null);
  // Fetch interactions with max allowed page size (100) to get corrections count
  const { data: interactionsData } = useModelInteractions(id || null, {
    page: 1,
    page_size: 100, // Max allowed by backend
  });
  // Fetch training job to get provider configuration parameters
  const { data: trainingJob } = useJob(model?.training_job_id || undefined);
  const updateReasoningMutation = useUpdateModelReasoning();
  // Fetch provider configuration schema to get field labels
  // Use model.provider_id as fallback if training job doesn't have provider_id
  const providerId = trainingJob?.provider_id || model?.provider_id;
  const { data: providerConfig } = useProviderConfiguration(providerId || undefined);
  // Fetch defaults to merge with stored parameters for complete display
  const { data: defaultsData } = useProviderConfigurationDefaults(
    providerId || undefined,
    model?.dataset_id || undefined
  );
  // Fetch dataset to get file information
  const { data: dataset } = useDataset(model?.dataset_id || null);
  const hostModel = useHostModel();
  const queryClient = useQueryClient();
  const [showClassificationsModal, setShowClassificationsModal] = useState(false);

  // Joyride state
  const [runTour, setRunTour] = useState(false);

  // External real metrics data
  const [realMetricsData, setRealMetricsData] = useState<any>(null);

  useEffect(() => {
    if (model?.training_job_id && (model.status === 'ready' || model.status === 'hosted_active')) {
      getExternalJobResult(model.training_job_id)
        .then(result => {
          if (result && result.curves && result.metrics) {
            setRealMetricsData(result);
          }
        })
        .catch(err => console.error('Failed to fetch external job results for metrics', err));
    }
  }, [model?.training_job_id, model?.status]);

  useEffect(() => {
    if (searchParams.get('tour') === 'true') {
      // Small delay to ensure tabs are rendered
      setTimeout(() => setRunTour(true), 500);
      // Clean up URL so refresh doesn't trigger tour again
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('tour');
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }
  }, [searchParams, navigate]);

  // tour steps will be defined in render when canTestModel is available

  const handleHost = async () => {
    if (!id) return;
    try {
      await hostModel.mutateAsync(id);
    } catch (err) {
      console.error('Failed to host model:', err);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Model Details">
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  if (error || !model) {
    return (
      <PageContainer title="Model Details">
        <div className="text-center py-12">
          <p className="text-status-error">Model not found</p>
          <Link to="/models" className="text-accent-primary mt-4 inline-block">
            Back to Models
          </Link>
        </div>
      </PageContainer>
    );
  }

  const canTestModel = model && (model.status === 'ready' || model.status === 'hosted_active');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'benchmarks', label: 'Benchmarks' },
    // { id: 'recommendations', label: 'Recommendations' },
    ...(canTestModel ? [{ id: 'test', label: 'Test Model' }] : []),
  ];

  const handlePredictionComplete = (interaction?: any) => {
    // Invalidate queries to refresh stats and interactions
    if (id) {
      queryClient.invalidateQueries({ queryKey: ['model-stats', id] });
      queryClient.invalidateQueries({ queryKey: ['model-interactions', id] });
      queryClient.invalidateQueries({ queryKey: ['model', id] });
    }
  };

  const tourSteps: Step[] = [
    {
      target: '#tour-tab-overview',
      content: 'Here you can view the general details, configuration, and hardware parameters of your newly created model.',
      disableBeacon: true,
      placement: 'bottom' as const,
    },
    {
      target: '#tour-tab-metrics',
      content: 'Check the performance metrics, confusion matrices, and detailed score breakdowns.',
      placement: 'bottom' as const,
    },
    {
      target: '#tour-tab-benchmarks',
      content: 'Compare this model against others in your workspace to see which performs best.',
      placement: 'bottom' as const,
    },
    ...(canTestModel ? [{
      target: '#tour-tab-test',
      content: 'Upload your own datasets to run inferences and test the model in action!',
      placement: 'bottom' as const,
    }] : []),
  ];

  return (
    <PageContainer>
      {/* Back button */}
      <button
        onClick={() => navigate('/models')}
        className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Models</span>
      </button>

      {/* Warning for models without classifications */}
      {/* {!model.classifications || model.classifications.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-amber-700 font-semibold mb-1">
                Classifications Not Configured
              </h3>
              <p className="text-amber-600 text-sm mb-3">
                This model doesn't have classifications defined. Classifications are typically extracted from the training dataset during model creation, but can be added manually if needed.
              </p>
              <Button
                onClick={() => setShowClassificationsModal(true)}
                size="sm"
                variant="secondary"
              >
                Add Classifications
              </Button>
            </div>
          </div>
        </div>
      ) : null} */}

      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        disableScrolling={true}
        styles={{
          options: {
            primaryColor: '#3850A0', // Theme color requested by user
            textColor: '#333',
            zIndex: 10000,
          },
        }}
        callback={(data) => {
          const { status } = data;
          if (status === 'finished' || status === 'skipped') {
            setRunTour(false);
          }
        }}
      />

      <Tabs tabs={tabs.map(t => ({ ...t, id: t.id, label: <div id={`tour-tab-${t.id}`}>{t.label}</div> }))} defaultTab={tabParam && tabs.some(t => t.id === tabParam) ? tabParam : "overview"}>
        {(activeTab) => (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
                  {/* Background decorative element */}
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-gray-900">
                    <Brain size={300} />
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center shadow-sm flex-shrink-0">
                        <Brain className="w-8 h-8 text-brand-50" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                            {model.name}
                          </h1>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${model.status === 'ready' || model.status === 'hosted_active'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : model.status === 'training'
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                              : model.status === 'error'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                            {model.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {model.display_id && (
                            <span className="text-xs font-mono px-2.5 py-1 rounded border bg-gray-50 border-gray-200 text-gray-700">
                              {model.display_id}
                            </span>
                          )}
                          {model.hosting_status && (
                            <span className={`text-xs font-mono px-2.5 py-1 rounded border capitalize ${model.hosting_status === 'active'
                              ? 'bg-violet-50 border-violet-200 text-brand-50'
                              : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}>
                              Hosting: {model.hosting_status}
                            </span>
                          )}
                          {model.provider_name && (
                            <span className="text-xs font-mono px-2.5 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700">
                              {model.provider_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                      {model.status === 'ready' && model.hosting_status !== 'active' && (
                        <Button onClick={handleHost} variant='secondary' disabled={hostModel.isPending} className="flex-1 md:flex-none">
                          {hostModel.isPending ? 'Deploying...' : 'Deploy Model'}
                        </Button>
                      )}

                      {model.hosting_status === 'active' && (
                        <Link
                          to={`/models/${model.id}/api-details`}
                          className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-50 text-white font-medium hover:bg-violet-700 transition-colors whitespace-nowrap"
                        >
                          <BookOpen className="w-4 h-4" />
                          API
                        </Link>
                      )}
                    </div>
                  </div>

                  {model.description && (
                    <p className="relative z-10 text-gray-600 mt-6 max-w-3xl text-lg leading-relaxed border-l-2 border-brand-50 pl-4">
                      {model.description}
                    </p>
                  )}

                  {/* Quick Stats */}
                  <div className="relative z-10 flex flex-col w-full justify-between md:flex-row gap-4 mt-8">

                    <div className="bg-gray-50 border w-full border-gray-200 rounded-xl p-4 transition-colors group items-center justify-center flex flex-col">
                      <div className="flex items-center gap-2 text-gray-500 mb-3">
                        <Cpu size={16} className="text-brand-50" />
                        <span className="text-xs font-medium uppercase tracking-wider">Provider</span>
                      </div>
                      <p className="text-2xl font-mono font-bold text-gray-900 truncate" title={model.provider_name || 'Not assigned'}>
                        {model.provider_name || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 border w-full border-gray-200 rounded-xl p-4 transition-colors group items-center justify-center flex flex-col">
                      <div className="flex items-center gap-2 text-gray-500 mb-3">
                        <Zap size={16} className="text-brand-50" />
                        <span className="text-xs font-medium uppercase tracking-wider">Status</span>
                      </div>
                      <p className="text-2xl font-mono font-bold text-gray-900 capitalize">
                        {model.status.replace(/_/g, ' ')}
                      </p>
                    </div>

                    <div className="bg-gray-50 border w-full border-gray-200 rounded-xl p-4 transition-colors group items-center justify-center flex flex-col">
                      <div className="flex items-center gap-2 text-gray-500 mb-3">
                        <BarChart3 size={16} className="text-brand-50" />
                        <span className="text-xs font-medium uppercase tracking-wider">Predictions</span>
                      </div>
                      <p className="text-2xl font-mono font-bold text-gray-900">
                        {model.prediction_count.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-gray-50 border w-full border-gray-200 rounded-xl p-4 transition-colors group items-center justify-center flex flex-col">
                      <div className="flex items-center gap-2 text-gray-500 mb-3">
                        <Activity size={16} className="text-brand-50" />
                        <span className="text-xs font-medium uppercase tracking-wider">Avg Confidence</span>
                      </div>
                      <p className="text-2xl font-mono font-bold text-gray-900">
                        {stats?.average_confidence !== undefined && stats?.average_confidence !== null ? `${(stats.average_confidence * 100).toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>

                  </div>
                </div>

                {/* 2-Column Card Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-8">


                    {/* Provider Configuration Card */}
                    {(model.configuration || trainingJob?.parameters) && (
                      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-brand-50/30 transition-all duration-300 group">
                        <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
                          <Settings size={200} />
                        </div>
                        <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-brand-50">
                            <Settings size={20} />
                          </div>
                          Provider Configuration
                        </h3>
                        <div className="relative z-10">
                          <ProviderConfigurationDisplay
                            parameters={(() => {
                              const storedParams = model.configuration || trainingJob?.parameters || {};
                              const defaults = defaultsData?.values || {};
                              return { ...defaults, ...storedParams };
                            })()}
                            fields={providerConfig?.fields || []}
                          />
                        </div>
                      </div>
                    )}

                    {/* Submission Details Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-brand-50/30 transition-all duration-300 group">
                      <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
                        <Package size={200} />
                      </div>
                      <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-brand-50">
                          <Package size={20} />
                        </div>
                        Submission Details
                      </h3>
                      <div className="relative z-10">
                        <JobSubmissionDetails
                          trainingJob={trainingJob}
                          dataset={dataset}
                          model={model}
                        />
                      </div>
                    </div>

                  </div>

                  {/* Right Column */}
                  <div className="space-y-8">

                    {/* Details Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-brand-50/30 transition-all duration-300 group">
                      <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
                        <Hash size={200} />
                      </div>
                      <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-brand-50">
                          <Hash size={20} />
                        </div>
                        Details
                      </h3>
                      <div className="relative z-10 space-y-5">
                        {model.display_id && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Display ID</span>
                            <code className="text-gray-700 text-sm font-medium font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{model.display_id}</code>
                          </div>
                        )}
                        {model.training_job_name && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Training Job</span>
                            <Link
                              to={`/jobs/${model.training_job_id}`}
                              className="text-brand-50 hover:underline font-medium"
                            >
                              {model.training_job_name}
                            </Link>
                          </div>
                        )}
                        {model.dataset_name && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Dataset</span>
                            <Link
                              to={`/datasets/${model.dataset_id}`}
                              className="text-brand-50 hover:underline font-medium"
                            >
                              {model.dataset_name}
                            </Link>
                          </div>
                        )}
                        {model.provider_name && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Provider</span>
                            <p className="text-gray-900 font-medium">{model.provider_name}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Created By</span>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900 font-medium">{model.created_by_name || 'Unknown'}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Created At</span>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900 font-medium">{new Date(model.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Usage Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-brand-50/30 transition-all duration-300 group">
                      <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
                        <BarChart3 size={200} />
                      </div>
                      <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-brand-50">
                          <BarChart3 size={20} />
                        </div>
                        Usage
                      </h3>
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Predictions</span>
                          </div>
                          <span className="text-gray-900 font-semibold text-sm">
                            {model.prediction_count.toLocaleString()}
                          </span>
                        </div>
                        {model.last_used_at && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">Last Used</span>
                            </div>
                            <span className="text-gray-900 text-sm">
                              {new Date(model.last_used_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enable Reasoning Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-brand-50/30 transition-all duration-300 group">
                      <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
                        <Brain size={200} />
                      </div>
                      <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-brand-50">
                          <Brain size={20} />
                        </div>
                        AI Reasoning
                      </h3>
                      <div className="relative z-10 space-y-3">
                        <label
                          htmlFor="enable-reasoning"
                          className="flex items-start gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            id="enable-reasoning"
                            checked={model?.enable_reasoning || false}
                            onChange={(e) => {
                              if (id) {
                                updateReasoningMutation.mutate({
                                  modelId: id,
                                  enableReasoning: e.target.checked,
                                });
                              }
                            }}
                            disabled={updateReasoningMutation.isPending || !model}
                            className="mt-1 w-5 h-5 rounded border-2 border-gray-300 bg-white text-brand-50 focus:ring-2 focus:ring-brand-50 focus:ring-offset-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed checked:bg-brand-50 checked:border-brand-50 transition-colors"
                          />
                          <div className="flex-1">
                            <span className="block text-xs text-gray-500 uppercase tracking-wider font-semibold">Enable Reasoning</span>
                            <p className="text-gray-500 text-sm mt-1">
                              Generate AI explanations for model predictions
                            </p>
                          </div>
                        </label>
                        {updateReasoningMutation.isPending && (
                          <p className="text-gray-400 text-xs">Updating...</p>
                        )}
                        {updateReasoningMutation.isError && (
                          <p className="text-red-500 text-xs">Failed to update. Please try again.</p>
                        )}
                      </div>
                    </div>

                    {/* Model Information Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-brand-50/30 transition-all duration-300 group">
                      <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
                        <Server size={200} />
                      </div>
                      <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-brand-50">
                          <Server size={20} />
                        </div>
                        Model Information
                      </h3>
                      <div className="relative z-10 space-y-5">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Status</span>
                            <p className="text-gray-900 font-medium capitalize">{model.status.replace(/_/g, ' ')}</p>
                          </div>
                          {model.hosting_status && (
                            <div>
                              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Hosting</span>
                              <p className="text-gray-900 font-medium capitalize">{model.hosting_status}</p>
                            </div>
                          )}
                        </div>

                        {/* Hosting Information */}
                        {model.hosting_status === 'active' && (
                          <div className="pt-4 border-t border-gray-100 space-y-4">
                            <h4 className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Hosting Details</h4>
                            {model.hosting_endpoint && (
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Endpoint</span>
                                <div className="flex items-center gap-2">
                                  <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <a
                                    href={model.hosting_endpoint}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-brand-50 hover:underline text-sm break-all"
                                  >
                                    {model.hosting_endpoint}
                                  </a>
                                </div>
                              </div>
                            )}
                            {model.client_id && (
                              <HostingCredentialField label="Client ID" value={model.client_id} />
                            )}
                            {model.client_secret && (
                              <HostingCredentialField label="Client Secret" value={model.client_secret} isSecret />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-6">
                <ModelMetrics
                  model={model}
                  interactions={interactionsData?.interactions || []}
                  totalInteractions={interactionsData?.total}
                  realMetricsData={realMetricsData}
                />
              </div>
            )}

            {activeTab === 'benchmarks' && (
              <div className="space-y-6">
                <ModelCompare />
              </div>
            )}

            {activeTab === 'recommendations' && id && (
              <Card padding="lg">
                <RecommendationsConfig
                  modelId={id}
                  currentConfig={model.recommendations_config || undefined}
                  modelClassifications={model.classifications}
                  onSave={() => {
                    if (id) {
                      queryClient.invalidateQueries({ queryKey: ['model', id] });
                    }
                  }}
                />
              </Card>
            )}



            {activeTab === 'test' && id && (
              <div className="space-y-6">
                {/* Upload and Prediction */}
                <ModelInferenceUpload
                  modelId={id}
                  modelClassifications={model?.classifications}
                  onPredictionComplete={handlePredictionComplete}
                />

                {/* Statistics */}
                <ModelStats modelId={id} />

                {/* Interaction History */}
                <ModelInteractionHistory modelId={id} />
              </div>
            )}
          </>
        )}
      </Tabs>

      {/* Add Classifications Modal */}
      {id && (
        <AddClassificationsModal
          isOpen={showClassificationsModal}
          onClose={() => setShowClassificationsModal(false)}
          modelId={id}
          currentClassifications={model?.classifications}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['model', id] });
            setShowClassificationsModal(false);
          }}
        />
      )}
    </PageContainer>
  );
};

// Helper component to display provider configuration parameters
interface ProviderConfigurationDisplayProps {
  parameters: Record<string, unknown>;
  fields: ProviderConfigurationField[];
}

// Hosting Credential Field Component
interface HostingCredentialFieldProps {
  label: string;
  value: string;
  isSecret?: boolean;
}

const HostingCredentialField = ({ label, value, isSecret = false }: HostingCredentialFieldProps) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayValue = isSecret && !isRevealed ? '•'.repeat(32) : value;

  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-grey-50 dark:bg-surface-elevated rounded-lg text-sm font-mono text-text-primary break-all">
          {displayValue}
        </code>
        {isSecret && (
          <button
            onClick={() => setIsRevealed(!isRevealed)}
            className="p-2 hover:bg-grey-100 dark:hover:bg-surface rounded-lg transition-colors"
            aria-label={isRevealed ? 'Hide' : 'Reveal'}
          >
            {isRevealed ? (
              <EyeOff className="w-4 h-4 text-text-tertiary" />
            ) : (
              <Eye className="w-4 h-4 text-text-tertiary" />
            )}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-grey-100 dark:hover:bg-surface rounded-lg transition-colors"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-4 h-4 text-success-500" />
          ) : (
            <Copy className="w-4 h-4 text-text-tertiary" />
          )}
        </button>
      </div>
    </div>
  );
};

const ProviderConfigurationDisplay = ({
  parameters,
  fields,
}: ProviderConfigurationDisplayProps) => {
  // Create a map of field_key to field for quick lookup
  const fieldMap = useMemo(() => {
    const map = new Map<string, ProviderConfigurationField>();
    fields.forEach((field) => {
      map.set(field.field_key, field);
    });
    return map;
  }, [fields]);

  // Format parameter value based on field type
  const formatValue = (field: ProviderConfigurationField | undefined, value: unknown): string => {
    if (value === null || value === undefined) return 'Not set';

    if (!field) return String(value);

    switch (field.field_type) {
      case 'float':
        const floatVal = typeof value === 'number' ? value : parseFloat(String(value));
        if (isNaN(floatVal)) return String(value);
        const formatted = floatVal % 1 === 0 ? floatVal.toFixed(0) : floatVal.toFixed(2);
        return field.validation_rules?.unit ? `${formatted} ${field.validation_rules.unit}` : formatted;
      case 'integer':
        return String(value);
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'select':
        // Format device_type specially
        if (field.field_key === 'device_type') {
          const deviceStr = String(value);
          if (deviceStr === 'dirac-1') return 'Dirac 1';
          if (deviceStr === 'dirac-3') return 'Dirac 3';
          return deviceStr;
        }
        return String(value);
      default:
        return String(value);
    }
  };

  // Get visible parameters separated by type (matching Review step logic)
  const getVisibleParameters = useMemo(() => {
    const conditionallyVisibleFields = fields.filter((field) => {
      // First check if field has a value
      const value = parameters[field.field_key];
      if (value === undefined || value === null || value === '') {
        return false;
      }

      if (!field.controlling_field) {
        return true;
      }

      const controllingValue = parameters[field.controlling_field];
      if (controllingValue === undefined || controllingValue === null) {
        return false;
      }

      if (field.controlling_value === null || field.controlling_value === undefined) {
        return true;
      }

      let expectedValue: any = field.controlling_value;
      if (typeof expectedValue === 'object' && expectedValue !== null && !Array.isArray(expectedValue) && 'value' in expectedValue) {
        expectedValue = (expectedValue as Record<string, unknown>).value;
      }

      if (Array.isArray(expectedValue)) {
        return expectedValue.includes(controllingValue);
      }
      return expectedValue === controllingValue;
    });

    const hardwareFields = conditionallyVisibleFields
      .filter((field) => field.parameter_type === 'hardware')
      .sort((a, b) => a.display_order - b.display_order);

    const standardFields = conditionallyVisibleFields
      .filter((field) => field.parameter_type === 'standard')
      .sort((a, b) => a.display_order - b.display_order);

    return { hardwareFields, standardFields };
  }, [fields, parameters]);

  const { hardwareFields, standardFields } = getVisibleParameters;

  // Format parameter value for display
  const formatParameterValue = (fieldKey: string, value: unknown): string => {
    const field = fieldMap.get(fieldKey);
    return formatValue(field, value);
  };

  if (hardwareFields.length === 0 && standardFields.length === 0) {
    // Fallback: show all parameters with default formatting
    return (
      <div className="space-y-2">
        {Object.entries(parameters).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-text-secondary text-sm capitalize">
              {key.replace(/_/g, ' ')}
            </span>
            <span className="text-text-primary text-sm font-medium">
              {String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hardwareFields.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-grey-700 dark:text-text-primary mb-4">Hardware Parameters</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
            {hardwareFields.map((field) => {
              const value = parameters[field.field_key];
              return (
                <div key={field.field_key} className="flex justify-between items-center py-1">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{field.label}</span>
                  <span className="text-gray-900 text-sm font-bold bg-gray-50 px-2 py-1 rounded border border-gray-100">
                    {formatParameterValue(field.field_key, value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {standardFields.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-grey-700 dark:text-text-primary mb-4">Standard Parameters</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
            {standardFields.map((field) => {
              const value = parameters[field.field_key];
              return (
                <div key={field.field_key} className="flex justify-between items-center py-1">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{field.label}</span>
                  <span className="text-gray-900 text-sm font-bold bg-gray-50 px-2 py-1 rounded border border-gray-100">
                    {formatParameterValue(field.field_key, value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Job Submission Details Component
interface JobSubmissionDetailsProps {
  trainingJob: any;
  dataset: any;
  model?: any; // Model data to get stored num_variables
}

const JobSubmissionDetails = ({ trainingJob, dataset, model }: JobSubmissionDetailsProps) => {
  // Build job submission JSON
  const jobSubmissionJson = useMemo(() => {
    if (!trainingJob?.parameters) return null;

    const params = trainingJob.parameters as Record<string, unknown>;
    const deviceType = params.device_type as string || 'dirac-3';
    const deviceKey = `${deviceType}_qudit`;

    // Build device_config based on stored parameters
    const deviceConfig: Record<string, unknown> = {
      [deviceKey]: {
        num_samples: params.num_samples || 10,
        num_levels: params.num_levels || (params.variables_type === 'integer' ? Array(30).fill(2) : []),
        relaxation_schedule: params.relaxation_schedule || 1,
      },
    };

    if (params.variables_type === 'integer' && params.num_qubits_per_weight) {
      (deviceConfig[deviceKey] as Record<string, unknown>).num_qubits_per_weight = params.num_qubits_per_weight;
    }

    if (params.variables_type === 'continuous' && params.sum_constraint) {
      (deviceConfig[deviceKey] as Record<string, unknown>).sum_constraint = params.sum_constraint;
    }

    return {
      job_submission: {
        problem_config: {
          qudit_hamiltonian_optimization: {
            polynomial_file_id: dataset?.id?.substring(0, 24) || '695bf20cf346861caf621eb0',
          },
        },
        device_config: deviceConfig,
        job_name: trainingJob.name || 'test_integer_variable_hamiltonian_job',
      },
    };
  }, [trainingJob, dataset]);

  const fileJson = useMemo(() => {
    if (!dataset) return null;

    const fileName = dataset.file_path
      ? dataset.file_path.split('/').pop()?.replace(/\.[^/.]+$/, '') || dataset.name
      : dataset.name;

    let numVariables = 30; // Default fallback

    if (model?.num_variables) {
      numVariables = model.num_variables;
    } else if (trainingJob?.parameters) {
      const params = trainingJob.parameters as Record<string, unknown>;
      const numQubitsPerWeight = params.num_qubits_per_weight as number | undefined;

      if (numQubitsPerWeight && numQubitsPerWeight > 0) {
        const maxMultiplier = Math.floor(477 / numQubitsPerWeight);
        const multiplier = Math.floor(Math.random() * maxMultiplier) + 1;
        numVariables = multiplier * numQubitsPerWeight;
        // Ensure it's less than 477
        if (numVariables >= 477) {
          numVariables = Math.floor(477 / numQubitsPerWeight) * numQubitsPerWeight;
        }
      }
    }

    const totalDataEntries = Math.floor((numVariables * (numVariables + 1)) / 2);

    const sampleData = [
      { idx: [0, 1], val: 458.38748298037046 },
      { idx: [0, 2], val: 1335.1105702583488 },
      { idx: [0, 3], val: 4343.563557707129 },
    ];

    // Calculate last indices based on num_variables
    const lastIdx1 = numVariables - 2;
    const lastIdx2 = numVariables - 1;
    const lastData = [
      { idx: [lastIdx1 - 1, lastIdx1], val: 595162.0217208669 },
      { idx: [lastIdx1, lastIdx2], val: 1190324.0434417338 },
      { idx: [lastIdx2 - 1, lastIdx2], val: 2380648.0868834676 },
    ];

    // Create abbreviated data array (show first 3, then "...", then last 3)
    const abbreviatedData = [
      ...sampleData,
      {
        idx: ['...'],
        val: `... ${Math.max(0, totalDataEntries - 6)} more items ...`,
      },
      ...lastData,
    ];

    return {
      file_name: fileName,
      file_config: {
        polynomial: {
          num_variables: numVariables,
          min_degree: 1,
          max_degree: 2,
          data: abbreviatedData,
        },
      },
    };
  }, [dataset, trainingJob]);

  if (!jobSubmissionJson && !fileJson) {
    return <p className="text-text-tertiary text-sm">No submission details available</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Job Submission JSON */}
      {jobSubmissionJson && (
        <div>
          <h4 className="text-text-primary font-medium text-sm mb-2">Job Submission</h4>
          <pre className="text-xs text-text-secondary overflow-auto bg-surface p-4 rounded-lg border border-border max-h-96">
            {JSON.stringify(jobSubmissionJson, null, 2)}
          </pre>
        </div>
      )}

      {/* File JSON */}
      {fileJson && (
        <div className='flex flex-col w-[207%]'>
          <h4 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">File Configuration</h4>
          <pre className="text-xs text-text-secondary w-full overflow-auto bg-surface p-4 rounded-lg border border-border max-h-96">
            {JSON.stringify(fileJson, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ModelDetail;

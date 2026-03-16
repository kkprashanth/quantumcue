import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  XCircle,
  Trash2,
  Clock,
  Cpu,
  User,
  Calendar,
  AlertCircle,
  Activity,
  History,
  Settings,
  BarChart3,
  Zap,
  CheckCircle,
  XOctagon,
  Loader,
  Package,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { JobStatusBadge } from '../../components/jobs';
import { Button } from '../../components/ui/Button';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import {
  useJob,
  useJobAudit,
  useSubmitJob,
  useCancelJob,
  useDeleteJob,
} from '../../hooks/useJobs';
import { useModelByTrainingJob } from '../../hooks/useModels';
import { useProviderConfiguration, useProviderConfigurationDefaults } from '../../hooks/useProviderConfiguration';
import { useProviders } from '../../hooks/useProviders';
import {
  getJobTypeLabel,
  getJobPriorityConfig,
  getExternalJobResult,
  type JobStatus,
} from '../../api/endpoints/jobs';

export const JobDetail = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: job, isLoading, error } = useJob(jobId);
  const { data: auditLogs } = useJobAudit(jobId, job?.status);
  const { data: model } = useModelByTrainingJob(
    job?.status === 'completed' && job?.job_type === 'machine_learning' ? (jobId || null) : null
  );
  const { data: providerConfig } = useProviderConfiguration(job?.provider_id || undefined);
  const { data: defaultsData } = useProviderConfigurationDefaults(
    job?.provider_id || undefined,
    job?.dataset_id || undefined
  );
  const { data: providersData } = useProviders();

  const selectedProvider = providersData?.providers.find((p) => p.id === job?.provider_id);

  useEffect(() => {
    if (!jobId) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const pollExternalResults = async () => {
      try {
        const result = await getExternalJobResult(jobId);
        console.log('External Job Result:', result);

        // Stop polling if we clearly see it has finished
        if (result && (result.metrics || result.curves)) {
          console.log('External Job completed, stopping polling.');
          return;
        }
      } catch (err) {
        // Will fail initially or if network error, just log it.
        console.error('Failed to fetch external job result:', err);
      }

      if (isMounted) {
        timeoutId = setTimeout(pollExternalResults, 5000);
      }
    };

    pollExternalResults();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [jobId]);

  const submitJob = useSubmitJob();
  const cancelJob = useCancelJob();
  const deleteJob = useDeleteJob();

  const handleSubmit = async () => {
    if (!jobId) return;
    try {
      await submitJob.mutateAsync(jobId);
    } catch (err) {
      console.error('Failed to submit job:', err);
    }
  };

  const handleCancel = async () => {
    if (!jobId) return;
    try {
      await cancelJob.mutateAsync(jobId);
    } catch (err) {
      console.error('Failed to cancel job:', err);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobId) return;
    try {
      await deleteJob.mutateAsync(jobId);
      navigate('/jobs');
    } catch (err) {
      console.error('Failed to delete job:', err);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatAuditAction = (action: string): string => {
    const actionMap: Record<string, string> = {
      created: 'Created',
      submitted: 'Submitted',
      transforming_input: 'Encoding Input',
      queued: 'Queued',
      started: 'Started',
      executing: 'Executing',
      translating_results: 'Decoding Results',
      completed: 'Completed',
      status_changed: 'Status Changed',
      cancelled: 'Cancelled',
      failed: 'Failed',
    };
    return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Merge defaults with parameters to show all configuration values
  const allParameters = useMemo(() => {
    const parameters = (job?.parameters as Record<string, unknown>) || {};
    const merged = { ...(defaultsData?.values || {}), ...parameters };
    return merged;
  }, [defaultsData, job?.parameters]);

  const formatParameterValue = (fieldKey: string, value: unknown): string => {
    if (value === null || value === undefined) return 'Not set';

    if (!providerConfig) return String(value);

    const field = providerConfig.fields.find((f) => f.field_key === fieldKey);
    if (!field) return String(value);

    // Format based on field type
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
        return String(value);
      default:
        return String(value);
    }
  };

  const getVisibleParameters = (): Array<{ key: string; label: string; value: unknown; parameter_type: 'hardware' | 'standard' }> => {
    if (!providerConfig || !selectedProvider) return [];

    // First, filter fields based on conditional visibility (controlling_field logic)
    const conditionallyVisibleFields = providerConfig.fields.filter((field) => {
      // If no controlling field, always visible (if it has a value in allParameters)
      if (!field.controlling_field) {
        const value = allParameters[field.field_key];
        return value !== undefined && value !== null && value !== '';
      }

      // Check controlling field value (use allParameters which includes defaults)
      const controllingValue = allParameters[field.controlling_field];
      if (controllingValue === undefined || controllingValue === null) {
        return false; // Controlling field not set, hide dependent field
      }

      // Check if controlling value matches
      if (field.controlling_value === null || field.controlling_value === undefined) {
        // If controlling_value is null/undefined, show if controlling field has any value
        const value = allParameters[field.field_key];
        return value !== undefined && value !== null && value !== '';
      }

      // Handle array of controlling values
      if (Array.isArray(field.controlling_value)) {
        const matches = field.controlling_value.includes(controllingValue);
        if (!matches) return false;
      } else {
        // Direct value comparison
        if (field.controlling_value !== controllingValue) {
          return false;
        }
      }

      // If controlling field matches, check if this field has a value
      const value = allParameters[field.field_key];
      return value !== undefined && value !== null && value !== '';
    });

    // Separate by parameter type
    const hardwareFields = conditionallyVisibleFields
      .filter((field) => field.parameter_type === 'hardware')
      .sort((a, b) => a.display_order - b.display_order);

    const standardFields = conditionallyVisibleFields
      .filter((field) => field.parameter_type === 'standard')
      .sort((a, b) => a.display_order - b.display_order);

    // Combine: Hardware first, then Standard
    const allSortedFields = [...hardwareFields, ...standardFields];

    // Map to return format (use allParameters which includes defaults)
    return allSortedFields.map((field) => ({
      key: field.field_key,
      label: field.label,
      value: allParameters[field.field_key],
      parameter_type: field.parameter_type,
    }));
  };

  const visibleParams = getVisibleParameters();
  const hardwareParams = visibleParams.filter((p) => p.parameter_type === 'hardware');
  const standardParams = visibleParams.filter((p) => p.parameter_type === 'standard');

  const canSubmit = job?.status === 'draft' && job?.provider_id;
  const canCancel = job && ['pending', 'queued', 'running'].includes(job.status);
  const canDelete = true; // Allow deleting all jobs as per user request
  const hasResults = job?.status === 'completed' && job?.result_data;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-48 bg-gray-200 rounded-xl" />
            <div className="h-48 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !job) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertCircle className="text-red-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Job Not Found
          </h2>
          <p className="text-gray-600 mb-8 max-w-md">
            {error?.message || 'The requested job could not be found.'}
          </p>
          <Button variant="secondary" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Button>
        </div>
      </PageContainer>
    );
  }

  const priorityConfig = getJobPriorityConfig(job.priority);

  // Get status icon
  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'failed':
        return <XOctagon className="w-6 h-6 text-red-600" />;
      case 'running':
        return <Loader className="w-6 h-6 text-yellow-600 animate-spin" />;
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-gray-600" />;
      default:
        return <Clock className="w-6 h-6 text-blue-600" />;
    }
  };

  return (
    <PageContainer>
      {/* Back button */}
      <button
        onClick={() => navigate('/jobs')}
        className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Jobs</span>
      </button>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 mb-8 shadow-sm">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-gray-900">
          <Package size={300} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center shadow-sm">
              {getStatusIcon()}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  {job.name}
                </h1>
                <JobStatusBadge status={job.status} size="lg" />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {job.display_id && (
                  <span className="text-xs font-mono px-2.5 py-1 rounded border bg-gray-50 border-gray-200 text-gray-700">
                    {job.display_id}
                  </span>
                )}
                <span className={`text-xs font-mono px-2.5 py-1 rounded border bg-purple-50 border-purple-200 text-purple-700`}>
                  {getJobTypeLabel(job.job_type).toUpperCase()}
                </span>
                <span className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded border bg-gray-50 border-gray-200 ${priorityConfig.color}`}>
                  <Zap size={12} />
                  {priorityConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {hasResults && (
              <>
                <Link
                  to={`/jobs/${job.id}/results`}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-50 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Results
                </Link>
                {job.job_type === 'machine_learning' && (
                  <Link
                    to={`/jobs/${job.id}/compare`}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-50 text-white font-medium hover:bg-indigo-700 transition-colors"
                  >
                    <Activity className="w-4 h-4" />
                    Compare
                  </Link>
                )}
              </>
            )}
            {canSubmit && (
              <Button
                onClick={handleSubmit}
                isLoading={submitJob.isPending}
                className="flex-1 md:flex-none !bg-green-600 !hover:bg-green-700"
              >
                <Play className="w-4 h-4" />
                Submit Job
              </Button>
            )}
            {canCancel && (
              <Button
                variant="secondary"
                onClick={handleCancel}
                isLoading={cancelJob.isPending}
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </Button>
            )}
            {canDelete && (
              <Button
                variant="secondary"
                onClick={handleDeleteClick}
                isLoading={deleteJob.isPending}
                className="!text-red-600 !border-red-600/50 !hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {job.description && (
          <p className="relative z-10 text-gray-600 mt-6 max-w-3xl text-lg leading-relaxed border-l-2 border-blue-500 pl-4">
            {job.description}
          </p>
        )}

        {/* Quick Stats Grid */}
        <div className="relative z-10 flex flex-col w-full justify-between md:flex-row gap-4 mt-8">
          <div className="bg-gray-50 border w-full border-gray-200 rounded-xl p-4 transition-colors group items-center justify-center flex flex-col">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <Clock size={16} className="text-blue-600 group-hover:text-blue-500 transition-colors" />
              <span className="text-xs font-medium uppercase tracking-wider">Execution Time</span>
            </div>
            <p className="text-2xl font-mono font-bold text-gray-900">
              {formatDuration(job.execution_time_ms)}
            </p>
          </div>

          {/* <div className="bg-gray-50 border w-full border-gray-200 rounded-xl p-4 transition-colors group items-center justify-center flex flex-col">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <User size={16} className="text-blue-600 group-hover:text-blue-500 transition-colors" />
              <span className="text-xs font-medium uppercase tracking-wider">Created By</span>
            </div>
            <p className="text-2xl font-mono font-bold text-gray-900 truncate" title={job.created_by_name || 'Unknown'}>
              {job.created_by_name || 'Unknown'}
            </p>
          </div> */}

          <div className="bg-gray-50 border w-full border-gray-200 rounded-xl p-4 transition-colors group items-center justify-center flex flex-col">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <Cpu size={16} className="text-blue-600 group-hover:text-blue-500 transition-colors" />
              <span className="text-xs font-medium uppercase tracking-wider">Provider</span>
            </div>
            <p className="text-2xl font-mono font-bold text-gray-900 truncate" title={job.provider_name || 'Not assigned'}>
              {job.provider_name || 'Not assigned'}
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {job.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-600 font-medium">Job Failed</h3>
              <p className="text-gray-700 text-sm mt-1">{job.error_message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 group">
            <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
              <Settings size={200} />
            </div>

            <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-blue-600">
                <Settings size={20} />
              </div>
              Configuration
            </h3>

            <div className="relative z-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <InfoItem label="Job Type" value={getJobTypeLabel(job.job_type)} />
                <InfoItem
                  label="Priority"
                  value={
                    <span className={priorityConfig.color}>
                      {priorityConfig.label}
                    </span>
                  }
                />
              </div>

              {selectedProvider && visibleParams.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-base font-semibold text-navy-700 dark:text-navy-400 uppercase tracking-wider mb-4 border-b border-border-primary pb-2">
                    {selectedProvider.name} Parameters
                  </h4>
                  {hardwareParams.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-xs font-bold text-grey-500 dark:text-text-tertiary uppercase tracking-tight mb-3">Hardware Parameters</h5>
                      <div className="grid grid-cols-1 gap-y-2">
                        {hardwareParams.map((param) => (
                          <div key={param.key} className="flex justify-between">
                            <span className="text-gray-600 text-sm">{param.label}</span>
                            <span className="text-gray-900 text-sm font-medium">
                              {formatParameterValue(param.key, param.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {standardParams.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-grey-500 dark:text-text-tertiary uppercase tracking-tight mb-3">Standard Parameters</h5>
                      <div className="grid grid-cols-1 gap-y-2">
                        {standardParams.map((param) => (
                          <div key={param.key} className="flex justify-between">
                            <span className="text-gray-600 text-sm">{param.label}</span>
                            <span className="text-gray-900 text-sm font-medium">
                              {formatParameterValue(param.key, param.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timeline Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 group">
            <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
              <Calendar size={200} />
            </div>

            <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-blue-600">
                <Calendar size={20} />
              </div>
              Timeline
            </h3>

            <div className="relative z-10 space-y-3">
              <TimelineItem label="Created" date={job.created_at} />
              <TimelineItem label="Submitted" date={job.submitted_at} />
              <TimelineItem label="Started" date={job.started_at} />
              <TimelineItem label="Completed" date={job.completed_at} />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Activity Log Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 group h-[53.5%]">
            <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
              <History size={200} />
            </div>

            <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-blue-600">
                <History size={20} />
              </div>
              Activity Log
            </h3>

            <h5 className="relative z-10 text-xs font-bold text-grey-500 dark:text-text-tertiary uppercase tracking-tight mb-4">
              Log Events
            </h5>

            {auditLogs && auditLogs.length > 0 ? (
              <div className="relative z-10 space-y-3 max-h-[80%] overflow-y-auto">
                {auditLogs.map((log) => {
                  const status = log.new_status as JobStatus | null;

                  // Get status-specific styling
                  const getStatusStyles = () => {
                    if (!status) {
                      return {
                        bg: 'bg-gray-50',
                        border: 'border-gray-200',
                      };
                    }

                    switch (status) {
                      case 'pending':
                        return {
                          bg: 'bg-blue-50',
                          border: 'border-blue-200',
                        };
                      case 'queued':
                        return {
                          bg: 'bg-indigo-50',
                          border: 'border-indigo-200',
                        };
                      case 'running':
                        return {
                          bg: 'bg-yellow-50',
                          border: 'border-yellow-200',
                        };
                      case 'completed':
                        return {
                          bg: 'bg-green-50',
                          border: 'border-green-200',
                        };
                      case 'failed':
                        return {
                          bg: 'bg-red-50',
                          border: 'border-red-200',
                        };
                      case 'cancelled':
                        return {
                          bg: 'bg-gray-50',
                          border: 'border-gray-200',
                        };
                      default:
                        return {
                          bg: 'bg-gray-50',
                          border: 'border-gray-200',
                        };
                    }
                  };

                  const styles = getStatusStyles();

                  return (
                    <div
                      key={log.id}
                      className={`flex items-start p-3 rounded-lg border ${styles.bg} ${styles.border} transition-colors`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-900 font-medium text-sm">
                            {log.user_name || 'System'}
                          </span>
                          <span className="text-gray-600 text-sm">
                            {formatAuditAction(log.action)}
                          </span>
                          {log.new_status && (
                            <JobStatusBadge
                              status={log.new_status as JobStatus}
                              size="sm"
                            />
                          )}
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="relative z-10 text-gray-500 text-sm">No activity recorded yet.</p>
            )}
          </div>

          {/* Metrics Card */}
          <div className="pb-8 relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 group">
            <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
              <BarChart3 size={200} />
            </div>

            <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-blue-600">
                <BarChart3 size={20} />
              </div>
              Metrics
            </h3>

            <div className="relative z-10 space-y-4">
              <MetricItem
                icon={<Clock className="w-4 h-4" />}
                label="Execution Time"
                value={formatDuration(job.execution_time_ms)}
              />
              <MetricItem
                icon={<Clock className="w-4 h-4" />}
                label="Queue Time"
                value={formatDuration(job.queue_time_ms)}
              />
              {job.total_cost && (
                <MetricItem
                  icon={<BarChart3 className="w-4 h-4" />}
                  label="Total Cost"
                  value={`$${job.total_cost.toFixed(2)}`}
                />
              )}
              {job.dataset_id && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Dataset</span>
                    <Link to={`/datasets/${job.dataset_id}`} className="text-blue-600 hover:underline text-sm font-medium">
                      View Dataset
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Job"
        message="Are you sure you want to delete this job? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteJob.isPending}
      />
    </PageContainer>
  );
};

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

const InfoItem = ({ label, value, className = '' }: InfoItemProps) => (
  <div>
    <dt className="text-gray-500 text-xs uppercase tracking-wide">{label}</dt>
    <dd className={`text-gray-900 mt-0.5 ${className}`}>{value}</dd>
  </div>
);

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const MetricItem = ({ icon, label, value }: MetricItemProps) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-gray-600">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    <span className="text-gray-900 font-medium text-sm">{value}</span>
  </div>
);

interface TimelineItemProps {
  label: string;
  date: string | null;
}

const TimelineItem = ({ label, date }: TimelineItemProps) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-600 text-sm">{label}</span>
    <span className="text-gray-900 text-sm">
      {date
        ? new Date(date).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        : '-'}
    </span>
  </div>
);

export default JobDetail;

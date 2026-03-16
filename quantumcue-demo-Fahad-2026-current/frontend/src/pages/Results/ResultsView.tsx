/**
 * Results view page for completed jobs with new design system.
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle, Loader2, BarChart3, Download, Server, RotateCcw } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';

import { Button } from '../../components/ui/Button';
import {
  EnergyHistogram,
  SolutionDistribution,
} from '../../components/results';
import { useJobResults } from '../../hooks/useResults';
import { useHostModel, useModelByTrainingJob } from '../../hooks/useModels';
import { PrecisionRecallChart } from '../../components/charts/PrecisionRecallChart';
import { ROCCurveChart } from '../../components/charts/ROCCurveChart';
import { F1ThresholdChart, RateThresholdChart } from '../../components/charts';
import { HostModelModal } from '../../components/models/HostModelModal';
import { loadPRData, loadROCData } from '../../utils/mockChartData';
import type { PRCurveData, ROCCurveData } from '../../utils/mockChartData';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { getJobTypeLabel } from '../../api/endpoints/jobs';
import type { JobType } from '../../types';
import { useJob } from '../../hooks/useJobs';
import { JobStatusBadge } from '../../components/jobs';
import { getJobPriorityConfig } from '../../api/endpoints/jobs';
import { Package, Zap, CheckCircle, XOctagon, Clock, XCircle } from 'lucide-react';

export const ResultsView = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: results, isLoading, error } = useJobResults(jobId);
  const { data: job } = useJob(jobId);
  const [showHostModal, setShowHostModal] = useState(false);
  const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#3b82f6'];

  const { data: model, isLoading: isLoadingModel } = useModelByTrainingJob(
    results?.job_type === 'machine_learning' ? jobId || null : null
  );
  const hostModel = useHostModel();

  const [prData, setPRData] = useState<PRCurveData[]>([]);
  const [rocData, setROCData] = useState<ROCCurveData[]>([]);
  const [chartsLoading, setChartsLoading] = useState(false);

  useEffect(() => {
    if (results?.job_type === 'machine_learning' && model && !isLoadingModel) {
      let classifications = model.classifications;

      if (!classifications || classifications.length === 0) {
        if (model.recommendations_config && typeof model.recommendations_config === 'object') {
          const configKeys = Object.keys(model.recommendations_config);
          if (configKeys.length > 0) {
            classifications = configKeys.map(key => key.charAt(0).toUpperCase() + key.slice(1));
          }
        }
      }

      if (!classifications || classifications.length === 0) {
        const specs = (model.metrics as Record<string, unknown>)?.specs as Record<string, unknown> | undefined;
        const numClasses = specs?.['num_classes'] as number | undefined;
        if (numClasses && numClasses > 0) {
          classifications = Array.from({ length: numClasses }, (_, i) => `Class ${i + 1}`);
        } else {
          classifications = ['Class 1', 'Class 2', 'Class 3', 'Class 4'];
        }
      }

      if (classifications && classifications.length > 0) {
        setChartsLoading(true);

        const specs = (model.metrics as Record<string, unknown>)?.specs as Record<string, unknown> | undefined;
        const prAuc = specs?.['PR-AUC'] as number | undefined;
        const prAucStdDev = specs?.['PR-AUC_std_dev'] as number | undefined;
        const rocAuc = specs?.['ROC-AUC'] as number | undefined;
        const rocAucStdDev = specs?.['ROC-AUC_std_dev'] as number | undefined;

        Promise.all([
          loadPRData(classifications, prAuc, prAucStdDev),
          loadROCData(classifications, rocAuc, rocAucStdDev),
        ])
          .then(([pr, roc]) => {
            setPRData(pr);
            setROCData(roc);
          })
          .catch((err) => {
            console.error('Error loading chart data:', err);
          })
          .finally(() => {
            setChartsLoading(false);
          });
      } else {
        setPRData([]);
        setROCData([]);
      }
    } else {
      setPRData([]);
      setROCData([]);
    }
  }, [results?.job_type, model, isLoadingModel]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-navy-700 mx-auto mb-4" />
            <p className="text-grey-500 dark:text-text-secondary">Loading results...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !results) {
    return (
      <PageContainer>
        <div className="bg-error/10 border border-error/20 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-grey-900 dark:text-text-primary font-semibold text-lg mb-2">
            Unable to Load Results
          </h2>
          <p className="text-grey-500 dark:text-text-tertiary mb-4">
            {error?.message || 'The results could not be loaded. The job may not be complete yet.'}
          </p>
          <Link
            to={`/jobs/${jobId}`}
            className="inline-flex items-center gap-2 text-navy-700 hover:text-navy-800 dark:text-navy-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Job Details
          </Link>
        </div>
      </PageContainer>
    );
  }

  const hasOptimizationResults = results.solution || (results.samples && results.samples.length > 0);
  const hasMeasurementResults = results.measurements;

  const metricsSource = (results.model_metrics ?? model?.metrics ?? {}) as Record<string, unknown>;
  const modelSpecs = metricsSource.specs as Record<string, unknown> | undefined;

  const metricsDefinitions = [
    { key: 'accuracy', label: 'Average Accuracy', description: 'Overall correct predictions.' },
    { key: 'precision', label: 'Average Precision', description: 'Exactness of the model.' },
    { key: 'auc_roc', label: 'Average AUC-ROC', description: 'Area under ROC curve.' },
    { key: 'auc_pr', label: 'Average AUC-PR', description: 'Area under PR curve.' },
    { key: 'max_f1', label: 'Average Max F1', description: 'Best balance across thresholds.' }
  ];

  const scalarMetricsData = {
    name: model?.name || 'Model',
    accuracy: ((modelSpecs?.accuracy as number | undefined) ?? (metricsSource.final_accuracy as number | undefined)) || 0,
    precision: ((modelSpecs?.precision as number | undefined) ?? (metricsSource.precision as number | undefined)) || 0,
    auc_roc: (modelSpecs?.['ROC-AUC'] as number | undefined) || 0,
    auc_pr: (modelSpecs?.['PR-AUC'] as number | undefined) || 0,
    max_f1: ((modelSpecs?.F1 as number | undefined) ?? (metricsSource.f1_score as number | undefined)) || 0,
  };

  const generateRadialData = (metricKey: string, metricIndex: number) => {
    let rawVal = scalarMetricsData[metricKey as keyof typeof scalarMetricsData] as number;
    const value = rawVal > 1.05 ? rawVal : (rawVal * 100);

    return [{
      name: model?.name || 'Model',
      value: parseFloat(value.toFixed(1)),
      fill: CHART_COLORS[metricIndex % CHART_COLORS.length]
    }];
  };

  const handleDownload = () => {
    if (!model) return;

    // Create mock model files as JSON
    const modelData = {
      name: model.name,
      model_type: model.model_type,
      version: model.version || 1,
      created_at: new Date().toISOString(),
      weights: model.metrics?.weights || [],
      configuration: model.configuration || {},
      metadata: {
        display_id: model.display_id,
        training_job_id: model.training_job_id,
        provider_id: model.provider_id,
      },
    };

    // Create a blob with the model data
    const blob = new Blob([JSON.stringify(modelData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${model.name}quantumcue_model.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleHostConfirm = async () => {
    if (!model) return;
    try {
      await hostModel.mutateAsync(model.id);
      setShowHostModal(false);
      // Ensure latest model data is available immediately after hosting
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['model', model.id] });
      navigate(`/models/${model.id}`);
    } catch (err) {
      console.error('Failed to host model:', err);
    }
  };

  return (
    <PageContainer>
      {/* Back button */}
      <button
        onClick={() => navigate(`/jobs/${jobId}`)}
        className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Job Detais</span>
      </button>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 mb-8 shadow-sm">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-gray-900">
          <Package size={300} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center shadow-sm">
              {(() => {
                if (!job) return <Clock className="w-6 h-6 text-blue-600" />;
                switch (job.status) {
                  case 'completed': return <CheckCircle className="w-6 h-6 text-green-600" />;
                  case 'failed': return <XOctagon className="w-6 h-6 text-red-600" />;
                  case 'running': return <Loader2 className="w-6 h-6 text-yellow-600 animate-spin" />;
                  case 'cancelled': return <XCircle className="w-6 h-6 text-gray-600" />;
                  default: return <Clock className="w-6 h-6 text-blue-600" />;
                }
              })()}
            </div>
            <div>
              <div className="flex gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  {job?.name || results.job_name}
                </h1>
                {job && <JobStatusBadge status={job.status} size="lg" />}
              </div>

              {job && (
                <div className="flex flex-wrap items-center gap-3">
                  {job.display_id && (
                    <span className="text-xs font-mono px-2.5 py-1 rounded border bg-gray-50 border-gray-200 text-gray-700">
                      {job.display_id}
                    </span>
                  )}
                  <span className={`text-xs font-mono px-2.5 py-1 rounded border bg-purple-50 border-purple-200 text-purple-700`}>
                    {getJobTypeLabel(job.job_type).toUpperCase()}
                  </span>
                  {(() => {
                    const priorityConfig = getJobPriorityConfig(job.priority);
                    return (
                      <span className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded border bg-gray-50 border-gray-200 ${priorityConfig.color}`}>
                        <Zap size={12} />
                        {priorityConfig.label}
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {results.job_type === 'machine_learning' && model && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={handleDownload}
                >
                  Download
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Server className="w-4 h-4" />}
                  onClick={() => {
                    if (model.hosting_status === 'active') {
                      navigate(`/models/${model.id}/api-details`);
                      return;
                    }
                    setShowHostModal(true);
                  }}
                >
                  Host
                </Button>
              </>
            )}
            <Button variant="quantum" size="sm" leftIcon={<RotateCcw className="w-4 h-4" />}>
              Rerun
            </Button>
          </div>
        </div>
      </div>


      {/* Summary */}
      {/* Metrics Header */}
      <div className="mt-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex gap-1 p-1 rounded-lg bg-grey-100 dark:bg-surface-elevated">
            <div className="px-4 py-2 rounded-md text-sm font-semibold bg-[#3850A0] text-white">
              Metrics
            </div>
          </div>
          <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            This page shows the metrics and performance visualizations for your job.
          </span>
        </div>
        {results.job_type === 'machine_learning' ? (
          !model ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-navy-700" />
              <span className="ml-2 text-grey-500 dark:text-text-secondary">Loading model data...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* First Row: 5 Gauges */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {metricsDefinitions.map((metric, metricIndex) => {
                  const chartData = generateRadialData(metric.key, metricIndex);

                  return (
                    <div key={metric.key} className="bg-[#172554] border border-blue-900/30 rounded-xl p-5 shadow-sm flex flex-col items-center">
                      <div className="text-center w-full mb-2">
                        <h4 className="text-[15px] font-bold text-white mb-1">{metric.label}</h4>
                        <p className="text-xs text-blue-200/60 leading-tight">
                          {metric.description}
                        </p>
                      </div>

                      <div className="h-[220px] w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="70%"
                            outerRadius="100%"
                            barSize={20}
                            data={chartData}
                            startAngle={90}
                            endAngle={-270}
                          >
                            <PolarAngleAxis
                              type="number"
                              domain={[0, 100]}
                              tick={false}
                              axisLine={false}
                            />
                            <RadialBar
                              background={{ fill: 'rgba(255,255,255,0.05)' }}
                              dataKey="value"
                              cornerRadius={5}
                            />
                            <RechartsTooltip
                              formatter={((value: any, name: any, props: any) => [`${value}%`, props.payload.name]) as any}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: 'white' }}
                              itemStyle={{ color: 'white' }}
                              cursor={{ fill: 'transparent' }}
                              wrapperStyle={{ zIndex: 1000 }}
                            />
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full mt-2 grid grid-cols-1 gap-1.5 px-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-none shrink-0"
                              style={{ backgroundColor: chartData[0].fill }}
                            />
                            <span className="text-gray-300 truncate" title={chartData[0].name}>
                              {chartData[0].name}
                            </span>
                          </div>
                          <span className="font-semibold text-white ml-2">
                            {chartData[0].value}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Metrics Curves Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rocData.length > 0 && <ROCCurveChart data={rocData} jobName={results.job_name} />}
                {prData.length > 0 && <PrecisionRecallChart data={prData} jobName={results.job_name} />}
                <F1ThresholdChart />
                <RateThresholdChart type="TPR" />
                <RateThresholdChart type="TNR" />
                <RateThresholdChart type="FPR" />
                <div className="md:col-span-2">
                  <RateThresholdChart type="FNR" />
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Energy Histogram for optimization */}
            {hasOptimizationResults && results.samples && (
              <EnergyHistogram samples={results.samples} optimalEnergy={results.solution?.optimal_value} />
            )}

            {/* Measurement Distribution for gate-based */}
            {hasMeasurementResults && results.measurements && (
              <SolutionDistribution measurements={results.measurements} />
            )}

            {/* Additional charts based on job type */}
            {results.job_type === 'simulation' && results.simulation?.expectation_values && (
              <ExpectationValuesChart values={results.simulation.expectation_values} />
            )}

            {/* Placeholder if no visualizations available */}
            {(() => {
              const hasSimulationChart =
                results.job_type === 'simulation' && results.simulation?.expectation_values;

              const hasNoCharts =
                !hasOptimizationResults && !hasMeasurementResults && !hasSimulationChart;

              return hasNoCharts ? (
                <div className="col-span-2 bg-white dark:bg-surface rounded-xl border border-grey-200 dark:border-border p-12 text-center">
                  <BarChart3 className="w-12 h-12 text-grey-400 dark:text-text-tertiary mx-auto mb-4" />
                  <h3 className="text-grey-900 dark:text-text-primary font-semibold mb-2">
                    No Visualizations Available
                  </h3>
                  <p className="text-grey-500 dark:text-text-tertiary">
                    This job type doesn't have standard visualizations. Check the Data tab for detailed results.
                  </p>
                </div>
              ) : null;
            })()}
          </div>
        )}

      </div>

      {model && (
        <HostModelModal
          isOpen={showHostModal}
          onClose={() => setShowHostModal(false)}
          onConfirm={handleHostConfirm}
          modelName={model.name}
          isLoading={hostModel.isPending}
        />
      )}
    </PageContainer>
  );
};

/**
 * Expectation values chart for simulation results.
 */
interface ExpectationValuesChartProps {
  values: Record<string, number>;
}

const ExpectationValuesChart = ({ values }: ExpectationValuesChartProps) => {
  const entries = Object.entries(values);

  return (
    <div className="bg-white dark:bg-surface rounded-xl border border-grey-200 dark:border-border p-6">
      <h3 className="text-sm font-semibold text-grey-700 dark:text-text-primary mb-4">
        Expectation Values
      </h3>
      <div className="space-y-3">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center gap-4">
            <span className="text-grey-500 dark:text-text-tertiary font-mono text-sm w-16">{key}</span>
            <div className="flex-1 h-6 bg-grey-100 dark:bg-surface-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-quantum rounded-full transition-all"
                style={{
                  width: `${Math.abs(value) * 50 + 50}%`,
                  marginLeft: value < 0 ? `${50 - Math.abs(value) * 50}%` : '50%',
                }}
              />
            </div>
            <span className="text-grey-900 dark:text-text-primary font-mono text-sm w-20 text-right">
              {value.toFixed(4)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-grey-500 dark:text-text-tertiary text-xs mt-4 text-center">
        Values range from -1 to +1
      </p>
    </div>
  );
};

export default ResultsView;

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft, BarChart3, Activity, Zap, Check,
    ArrowRight as ArrowRightRight, LineChart as LineChartIcon,
    Crosshair, Percent, Target, Copy, Info
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useJob, useJobs } from '@/hooks/useJobs';
import { apiClient } from '@/api/client';
import html2canvas from 'html2canvas';
import { useProviders } from '@/hooks/useProviders';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    Area, ComposedChart, Cell, RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import { CustomTooltip } from '@/components/charts';
import { JobStatusBadge } from '@/components/jobs';
import { getMetricsData } from '@/utils/metricsData';

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#3b82f6'];

export const JobCompare = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();

    // Refs for charts
    const rocChartRef = React.useRef<HTMLDivElement>(null);
    const prChartRef = React.useRef<HTMLDivElement>(null);
    const f1ChartRef = React.useRef<HTMLDivElement>(null);
    const tprChartRef = React.useRef<HTMLDivElement>(null);
    const tnrChartRef = React.useRef<HTMLDivElement>(null);
    const fprChartRef = React.useRef<HTMLDivElement>(null);
    const fnrChartRef = React.useRef<HTMLDivElement>(null);

    // Recording copy success per chart
    const [copySuccess, setCopySuccess] = useState<Record<string, boolean>>({});
    const [isCopying, setIsCopying] = useState<Record<string, boolean>>({});

    const handleCopyChart = async (ref: React.RefObject<HTMLDivElement>, chartId: string) => {
        if (!ref.current) return;

        setIsCopying(prev => ({ ...prev, [chartId]: true }));
        try {
            const canvas = await html2canvas(ref.current, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
            });

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    console.error('Canvas is empty');
                    return;
                }

                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    setCopySuccess(prev => ({ ...prev, [chartId]: true }));
                    setTimeout(() => setCopySuccess(prev => ({ ...prev, [chartId]: false })), 2000);
                } catch (err) {
                    console.error('Failed to copy to clipboard:', err);
                }
            });
        } catch (err) {
            console.error('Failed to generate image:', err);
        } finally {
            setIsCopying(prev => ({ ...prev, [chartId]: false }));
        }
    };

    const [step, setStep] = useState<'selection' | 'results'>('selection');
    const [compareMode, setCompareMode] = useState<'provider' | 'date' | 'custom'>('provider');

    const [selectedProviderId, setSelectedProviderId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedCustomJobIds, setSelectedCustomJobIds] = useState<string[]>([]);

    const [selectedClassIndex, setSelectedClassIndex] = useState<number>(0);
    const [focusedJobName, setFocusedJobName] = useState<string | null>(null);

    const { data: currentJob, isLoading: isLoadingCurrent } = useJob(jobId);
    const { data: allJobsData, isLoading: isLoadingJobs } = useJobs();
    const { data: providersData } = useProviders();

    const availableMLJobs = useMemo(() => {
        if (!allJobsData?.jobs) return [];
        return allJobsData.jobs.filter(j =>
            j.id !== jobId &&
            j.job_type === 'machine_learning' &&
            j.status === 'completed'
        );
    }, [allJobsData, jobId]);

    const handleToggleCustomJob = (id: string) => {
        setSelectedCustomJobIds(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            if (prev.length >= 4) return prev; // Max 4
            return [...prev, id];
        });
    };

    const finalCompareJobIds = useMemo(() => {
        let ids: string[] = [];
        if (compareMode === 'provider' && selectedProviderId) {
            ids = availableMLJobs.filter(j => j.provider_id === selectedProviderId).map(j => j.id);
        } else if (compareMode === 'date' && selectedDate) {
            ids = availableMLJobs.filter(j => {
                if (!j.created_at) return false;
                return j.created_at.startsWith(selectedDate);
            }).map(j => j.id);
        } else if (compareMode === 'custom') {
            ids = selectedCustomJobIds;
        }
        return ids;
    }, [compareMode, selectedProviderId, selectedDate, selectedCustomJobIds, availableMLJobs]);

    const canCompare = finalCompareJobIds.length > 0;

    const handleCompare = () => {
        if (canCompare) {
            setStep('results');
        }
    };

    // Fetch results for selected jobs
    const jobIdsToFetch = useMemo(() => {
        if (step !== 'results') return [];
        return [jobId as string, ...finalCompareJobIds];
    }, [step, jobId, finalCompareJobIds]);

    const statsQueries = useQuery({
        queryKey: ['compare-jobs-stats', jobIdsToFetch],
        queryFn: async () => {
            const statsPromises = jobIdsToFetch.map(jId =>
                apiClient.get(`/jobs/${jId}/results`).then(res => res.data).catch(() => null)
            );
            const results = await Promise.all(statsPromises);

            return jobIdsToFetch.reduce((acc, jId, idx) => {
                const rawResults = results[idx] || {};

                const jobInfo = jId === currentJob?.id ? currentJob : availableMLJobs.find(j => j.id === jId);
                const mockSchema = getMetricsData(jId, jobInfo?.name, (jobInfo as any)?.parameters?.provider as string || jobInfo?.provider_name || undefined);

                acc[jId] = {
                    ...rawResults,
                    model_metrics: rawResults.model_metrics || {},
                    ...mockSchema // Mix in mock schema to easily draw charts
                };
                return acc;
            }, {} as Record<string, any>);
        },
        enabled: step === 'results' && jobIdsToFetch.length > 0,
    });

    if (isLoadingCurrent || isLoadingJobs) {
        return (
            <PageContainer title="Compare Jobs">
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            </PageContainer>
        );
    }

    if (!currentJob) {
        return (
            <PageContainer title="Compare Jobs">
                <div className="text-center py-12">
                    <p className="text-status-error">Job not found</p>
                    <Button variant="secondary" onClick={() => navigate('/jobs')} className="mt-4">
                        Back to Jobs
                    </Button>
                </div>
            </PageContainer>
        );
    }

    // --- CHART DATA PREPARATION ---
    const scalarMetricsData = (() => {
        if (!statsQueries.data) return [];

        return jobIdsToFetch.map(jId => {
            const jobInfo = jId === currentJob.id ? currentJob : availableMLJobs.find(j => j.id === jId);
            const stats = statsQueries.data[jId];

            const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

            return {
                name: jobInfo?.name || jId.substring(0, 8),
                accuracy: stats?.metrics?.accuracy ? (avg(stats.metrics.accuracy) * 100).toFixed(1) : 0,
                auc_roc: stats?.metrics?.auc_roc ? (avg(stats.metrics.auc_roc) * 100).toFixed(1) : 0,
                auc_pr: stats?.metrics?.auc_pr ? (avg(stats.metrics.auc_pr) * 100).toFixed(1) : 0,
                precision: stats?.metrics?.precision ? (avg(stats.metrics.precision) * 100).toFixed(1) : 0,
                max_f1: stats?.metrics?.max_f1 ? (avg(stats.metrics.max_f1) * 100).toFixed(1) : 0,
                isCurrent: jId === currentJob.id
            };
        });
    })();

    const numClasses = (jobId && statsQueries.data?.[jobId]?.numClasses) || 4;

    // Helpers to structure data for Recharts exactly like ModelCompare
    const extractSeriesData = (curveName: 'f1' | 'roc' | 'pr', extractor: (curve: any) => any[]) => {
        return jobIdsToFetch.map((jId, idx) => {
            const stats = statsQueries.data?.[jId];
            const name = jId === currentJob.id ? currentJob.name : (availableMLJobs.find(j => j.id === jId)?.name || jId);
            let data: any[] = [];

            if (stats?.curves?.[curveName]) {
                data = extractor(stats.curves[curveName]);
            }
            return { name, data, fill: CHART_COLORS[idx % CHART_COLORS.length] };
        });
    };

    const f1Series = extractSeriesData('f1', f1 => {
        const thresholds = f1.thresholds;
        const scores = f1.scores[selectedClassIndex] || [];
        return thresholds.map((x: number, i: number) => ({ x, y: scores[i] }));
    });

    const rocSeries = extractSeriesData('roc', roc => {
        const curve = roc[selectedClassIndex];
        if (!curve) return [];
        return curve.fpr.map((x: number, i: number) => ({ x, y: curve.tpr[i] }));
    });

    const prSeries = extractSeriesData('pr', pr => {
        const curve = pr[selectedClassIndex];
        if (!curve) return [];
        return curve.recall.map((x: number, i: number) => ({ x, y: curve.precision[i] }));
    });

    // Additional chart: FPR/TPR vs Threshold (using confusion rates)
    const confusionSeries = jobIdsToFetch.map((jId, idx) => {
        const stats = statsQueries.data?.[jId];
        const name = jId === currentJob.id ? currentJob.name : (availableMLJobs.find(j => j.id === jId)?.name || jId);
        let data: any[] = [];
        if (stats?.curves?.confusion_rates) {
            const cr = stats.curves.confusion_rates;
            const tpr = cr.tpr[selectedClassIndex] || [];
            const fpr = cr.fpr[selectedClassIndex] || [];
            data = cr.thresholds.map((x: number, i: number) => ({ x, tpr: tpr[i], fpr: fpr[i] }));
        }
        return { name, data, fill: CHART_COLORS[idx % CHART_COLORS.length] };
    });

    const formatDec = (val: number) => typeof val === 'number' ? val.toFixed(3) : val;

    const DarkTooltip = ({ active, payload, label, xLabel }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] z-[100]">
                    <p className="font-semibold text-white mb-2 pb-2 border-b border-slate-700">
                        {xLabel}: {payload[0]?.payload?.x !== undefined ? formatDec(payload[0].payload.x) : label}
                    </p>
                    {payload.map((entry: any) => (
                        <p key={entry.name} className="text-sm flex items-center justify-between gap-4 py-0.5" style={{ color: entry.stroke || entry.color || entry.fill }}>
                            <span className="capitalize text-slate-300">{entry.name}:</span>
                            <span className="font-mono font-bold text-white">{formatDec(entry.value)}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <PageContainer>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button
                        onClick={() => step === 'results' ? setStep('selection') : navigate(`/jobs/${currentJob.id}`)}
                        className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-2"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">
                            {step === 'results' ? 'Back to Selection' : 'Back to Job Details'}
                        </span>
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3 my-5">
                        <LineChartIcon className="text-brand-50 w-8 h-8" />
                        Compare Job Performance
                    </h1>
                    <p className="text-gray-500 mt-3">
                        Evaluating <strong className="text-gray-900">{currentJob.name}</strong> against other Machine Learning jobs
                    </p>
                </div>
            </div>

            {step === 'selection' && (
                <div className="space-y-6 max-w-4xl animate-fade-in">
                    <Card className="p-8 sm:p-10 bg-white/50 backdrop-blur-xl border-dashed border-gray-200">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shadow-lg shadow-brand-50/20">
                                <span className="text-white font-bold text-lg">1</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                                    Select Comparison Scope
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Choose how you want to compare models against the current job.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                                <div className="px-4 text-sm font-medium text-gray-600">
                                    {compareMode === 'custom' ? (
                                        <><span className="font-bold text-lg">{availableMLJobs.length}</span> jobs available</>
                                    ) : (
                                        <span>Select filter mode</span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-brand-50/20 focus-within:border-brand-50">
                                        <div className="px-3 py-2 border-r border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 object-fill">
                                            Mode
                                        </div>
                                        <select
                                            value={compareMode}
                                            onChange={(e) => setCompareMode(e.target.value as 'provider' | 'date' | 'custom')}
                                            className="text-sm border-0 focus:ring-0 cursor-pointer bg-transparent py-2 pl-3 pr-8 font-semibold text-gray-800"
                                        >
                                            <option value="provider">By Provider</option>
                                            <option value="date">By Date</option>
                                            <option value="custom">By Custom</option>
                                        </select>
                                    </div>

                                    {compareMode === 'provider' && (
                                        <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-brand-50/20 focus-within:border-brand-50">
                                            <div className="px-3 py-2 border-r border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 object-fill">
                                                Provider
                                            </div>
                                            <select
                                                value={selectedProviderId}
                                                onChange={(e) => setSelectedProviderId(e.target.value)}
                                                className="text-sm border-0 focus:ring-0 cursor-pointer bg-transparent py-2 pl-3 pr-8 font-semibold text-gray-800"
                                            >
                                                <option value="">All</option>
                                                {providersData?.providers.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {compareMode === 'date' && (
                                        <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-brand-50/20 focus-within:border-brand-50">
                                            <div className="px-3 py-2 border-r border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                                Date
                                            </div>
                                            <input
                                                type="date"
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="text-sm border-0 focus:ring-0 bg-transparent py-1.5 px-3 font-semibold text-gray-800 outline-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(compareMode === 'provider' && selectedProviderId) || (compareMode === 'date' && selectedDate) ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-600">
                                    Found <strong>{finalCompareJobIds.length}</strong> matching jobs to compare against.
                                </div>
                            ) : null}

                            {compareMode === 'custom' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {availableMLJobs.map((job: any) => {
                                        const isSelected = selectedCustomJobIds.includes(job.id);
                                        const isDisabled = !isSelected && selectedCustomJobIds.length >= 4;
                                        return (
                                            <div
                                                key={job.id}
                                                onClick={() => !isDisabled && handleToggleCustomJob(job.id)}
                                                className={`
                                                    relative overflow-hidden group p-5 rounded-2xl border-2 transition-all duration-300 flex items-start gap-4
                                                    ${isSelected
                                                        ? 'border-brand-50 bg-white shadow-md shadow-brand-50/10 cursor-pointer'
                                                        : isDisabled
                                                            ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                                            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm cursor-pointer'}
                                                `}
                                            >
                                                {isSelected && <div className="absolute inset-0 bg-gradient-to-br from-brand-50/5 to-transparent pointer-events-none" />}

                                                <div className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isSelected
                                                    ? 'bg-brand-50 border-brand-50 scale-110'
                                                    : 'border-gray-300 bg-white group-hover:border-gray-400'
                                                    }`}>
                                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                                </div>

                                                <div className="flex-1 min-w-0 z-10">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className={`font-semibold text-lg truncate pr-2 transition-colors duration-200 ${isSelected ? 'text-brand-700' : 'text-gray-900'}`}>
                                                            {job.name}
                                                        </h4>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                                        <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-md font-medium tracking-wide">
                                                            {job.status.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-xs px-2.5 py-1 bg-gray-100/80 text-gray-500 rounded-md font-medium tracking-wide">
                                                            {new Date(job.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
                                <Button
                                    onClick={handleCompare}
                                    disabled={!canCompare}
                                    className="px-8 bg-brand-50 gap-2"
                                >
                                    Run Comparison <ArrowRightRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {step === 'results' && (
                <div className="space-y-8 animate-fade-in">
                    {statsQueries.isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <LoadingSpinner />
                            <p className="mt-4 text-gray-500 font-medium animate-pulse">Aggregating complex job metrics...</p>
                        </div>
                    ) : (
                        <>
                            <Card className="p-6">
                                <div className="flex flex-col md:flex-row items-start justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center pb-10 min-w-fit gap-2 mr-10">
                                        <BarChart3 className="text-brand-50 w-6 h-6" />
                                        Summary Metrics
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
                                        {scalarMetricsData.map((job, idx) => {
                                            const isFocused = focusedJobName === job.name;
                                            const isDimmed = focusedJobName && !isFocused;

                                            return (
                                                <button
                                                    key={job.name}
                                                    onClick={() => setFocusedJobName(isFocused ? null : job.name)}
                                                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${isFocused ? 'bg-white border-brand-50 text-gray-900 shadow-sm'
                                                        : isDimmed ? 'border-transparent bg-transparent opacity-50 text-gray-500 hover:opacity-100'
                                                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <span className="w-3 h-3 rounded-none" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                                                    {job.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                                    {[
                                        { key: 'accuracy', label: 'Average Accuracy', description: 'Overall correct predictions.' },
                                        { key: 'precision', label: 'Average Precision', description: 'Exactness of the model.' },
                                        { key: 'auc_roc', label: 'Average AUC-ROC', description: 'Area under ROC curve.' },
                                        { key: 'auc_pr', label: 'Average AUC-PR', description: 'Area under PR curve.' },
                                        { key: 'max_f1', label: 'Average Max F1', description: 'Best balance across thresholds.' }
                                    ].map((metric) => {
                                        const chartData = scalarMetricsData.map((job, idx) => ({
                                            name: job.name,
                                            value: parseFloat(job[metric.key as keyof typeof job] as string) || 0,
                                            fill: CHART_COLORS[idx % CHART_COLORS.length]
                                        })).sort((a, b) => a.value - b.value);

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
                                                            innerRadius="20%"
                                                            outerRadius="100%"
                                                            barSize={10}
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
                                                            >
                                                                {chartData.map((entry, index) => (
                                                                    <Cell
                                                                        key={`cell-${index}`}
                                                                        fill={entry.fill}
                                                                        fillOpacity={focusedJobName ? (focusedJobName === entry.name ? 1 : 0.2) : 1}
                                                                    />
                                                                ))}
                                                            </RadialBar>
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

                                                {/* Custom Legend inside the card */}
                                                <div className="w-full mt-2 grid grid-cols-1 gap-1.5 px-2">
                                                    {[...chartData].reverse().map((dataItem, idx) => (
                                                        <div key={idx} className={`flex items-center justify-between text-xs transition-opacity duration-200 ${focusedJobName && focusedJobName !== dataItem.name ? 'opacity-30' : 'opacity-100'}`}>
                                                            <div className="flex items-center gap-2 truncate">
                                                                <span
                                                                    className="w-2.5 h-2.5 rounded-none shrink-0"
                                                                    style={{ backgroundColor: dataItem.fill }}
                                                                />
                                                                <span className="text-gray-300 truncate" title={dataItem.name}>
                                                                    {dataItem.name}
                                                                </span>
                                                            </div>
                                                            <span className="font-semibold text-white ml-2">
                                                                {dataItem.value}%
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                            <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Target className="w-5 h-5 text-gray-400" />
                                    <span className="font-medium text-gray-700">Detailed Curve Visualization</span>
                                </div>
                                <div className="flex items-center gap-3 mt-4 md:mt-0">
                                    <span className="text-sm text-gray-500 font-medium">Select Class:</span>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        {Array.from({ length: numClasses }, (_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedClassIndex(i)}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${selectedClassIndex === i ? 'bg-white text-brand-50 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                                    }`}
                                            >
                                                Class {i}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* 1. ROC Curve */}
                                <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={rocChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                    <div className="relative group inline-flex items-center cursor-help">
                                                        <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                        <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                            <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2">
                                                                {rocSeries.map((s) => (
                                                                    <div key={s.name} className="flex items-center gap-2">
                                                                        <span className="w-3 h-3 inline-block shadow-sm shrink-0" style={{ backgroundColor: s.fill }}></span>
                                                                        <span className="text-sm font-medium text-slate-300 leading-none whitespace-nowrap">{s.name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    ROC Curve
                                                </span>
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <XAxis
                                                    type="number"
                                                    dataKey="x"
                                                    name="FPR"
                                                    domain={[0, 1]}
                                                    tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }}
                                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                                    tickLine={false}
                                                    label={{
                                                        value: 'FPR',
                                                        position: 'insideBottom',
                                                        offset: -24,
                                                        fill: '#94a3b8',
                                                        fontSize: 16,
                                                        fontWeight: 'bold',
                                                    }}
                                                />
                                                <YAxis
                                                    type="number"
                                                    dataKey="y"
                                                    name="TPR"
                                                    domain={[0, 1]}
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                    tickFormatter={(val) => val === 0 ? '' : val}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    label={{
                                                        value: 'TPR',
                                                        angle: -90,
                                                        position: 'insideLeft',
                                                        fill: '#94a3b8',
                                                        fontSize: 16,
                                                        style: { textAnchor: 'middle' },
                                                        offset: 5,
                                                        fontWeight: 'bold',
                                                    }}
                                                />
                                                <RechartsTooltip content={<DarkTooltip xLabel="FPR" />} />
                                                {rocSeries.map((s, idx) => (
                                                    <Area key={s.name} name={s.name} data={s.data} dataKey="y" fill="transparent" stroke={s.fill} strokeWidth={2} type="monotone" />
                                                ))}
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleCopyChart(rocChartRef, 'roc')}
                                            className="hover:bg-blue-800/50 font-normal text-[#9EA4B0] h-8"
                                            disabled={isCopying['roc']}
                                            data-html2canvas-ignore="true"
                                        >
                                            {copySuccess['roc'] ? (
                                                <>
                                                    <Check className="w-4 h-4 mr-2 text-green-400" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4 mr-2" />
                                                    <span>Copy Chart</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* 2. PR Curve */}
                                <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={prChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                    <div className="relative group inline-flex items-center cursor-help">
                                                        <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                        <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                            <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2">
                                                                {rocSeries.map((s) => (
                                                                    <div key={s.name} className="flex items-center gap-2">
                                                                        <span className="w-3 h-3 inline-block shadow-sm shrink-0" style={{ backgroundColor: s.fill }}></span>
                                                                        <span className="text-sm font-medium text-slate-300 leading-none whitespace-nowrap">{s.name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    PR Curve
                                                </span>
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <XAxis
                                                    type="number"
                                                    dataKey="x"
                                                    name="Recall"
                                                    domain={[0, 1]}
                                                    tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }}
                                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                                    tickLine={false}
                                                    label={{
                                                        value: 'Recall',
                                                        position: 'insideBottom',
                                                        offset: -24,
                                                        fill: '#94a3b8',
                                                        fontSize: 16,
                                                        fontWeight: 'bold',
                                                    }}
                                                />
                                                <YAxis
                                                    type="number"
                                                    dataKey="y"
                                                    name="Precision"
                                                    domain={[0, 1]}
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                    tickFormatter={(val) => val === 0 ? '' : val}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    label={{
                                                        value: 'Precision',
                                                        angle: -90,
                                                        position: 'insideLeft',
                                                        fill: '#94a3b8',
                                                        fontSize: 16,
                                                        style: { textAnchor: 'middle' },
                                                        offset: 5,
                                                        fontWeight: 'bold',
                                                    }}
                                                />
                                                <RechartsTooltip content={<DarkTooltip xLabel="Recall" />} />
                                                {prSeries.map((s, idx) => (
                                                    <Area key={s.name} name={s.name} data={s.data} dataKey="y" fill="transparent" stroke={s.fill} strokeWidth={2} type="monotone" />
                                                ))}
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleCopyChart(prChartRef, 'pr')}
                                            className="hover:bg-blue-800/50 font-normal text-[#9EA4B0] h-8"
                                            disabled={isCopying['pr']}
                                            data-html2canvas-ignore="true"
                                        >
                                            {copySuccess['pr'] ? (
                                                <>
                                                    <Check className="w-4 h-4 mr-2 text-green-400" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4 mr-2" />
                                                    <span>Copy Chart</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* 3. F1 Curve */}
                                <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={f1ChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                    <div className="relative group inline-flex items-center cursor-help">
                                                        <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                        <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                            <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2">
                                                                {rocSeries.map((s) => (
                                                                    <div key={s.name} className="flex items-center gap-2">
                                                                        <span className="w-3 h-3 inline-block shadow-sm shrink-0" style={{ backgroundColor: s.fill }}></span>
                                                                        <span className="text-sm font-medium text-slate-300 leading-none whitespace-nowrap">{s.name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    F1S/Threshold
                                                </span>
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <XAxis
                                                    type="number"
                                                    dataKey="x"
                                                    name="Threshold"
                                                    domain={[0, 1]}
                                                    tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }}
                                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                                    tickLine={false}
                                                    label={{
                                                        value: 'Threshold',
                                                        position: 'insideBottom',
                                                        offset: -24,
                                                        fill: '#94a3b8',
                                                        fontSize: 16,
                                                        fontWeight: 'bold',
                                                    }}
                                                />
                                                <YAxis
                                                    type="number"
                                                    dataKey="y"
                                                    name="F1 Score"
                                                    domain={[0, 1]}
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                    tickFormatter={(val) => val === 0 ? '' : val}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    label={{
                                                        value: 'F1 Score',
                                                        angle: -90,
                                                        position: 'insideLeft',
                                                        fill: '#94a3b8',
                                                        fontSize: 16,
                                                        style: { textAnchor: 'middle' },
                                                        offset: 5,
                                                        fontWeight: 'bold',
                                                    }}
                                                />
                                                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} />
                                                {f1Series.map((s, idx) => (
                                                    <Area key={s.name} name={s.name} data={s.data} dataKey="y" fill="transparent" stroke={s.fill} strokeWidth={2} type="monotone" />
                                                ))}
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleCopyChart(f1ChartRef, 'f1')}
                                            className="hover:bg-blue-800/50 font-normal text-[#9EA4B0] h-8"
                                            disabled={isCopying['f1']}
                                            data-html2canvas-ignore="true"
                                        >
                                            {copySuccess['f1'] ? (
                                                <>
                                                    <Check className="w-4 h-4 mr-2 text-green-400" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4 mr-2" />
                                                    <span>Copy Chart</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* 4. True Positive Rate to Threshold */}
                                <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={tprChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                    <div className="relative group inline-flex items-center cursor-help">
                                                        <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                        <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                            <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2">
                                                                {rocSeries.map((s) => (
                                                                    <div key={s.name} className="flex items-center gap-2">
                                                                        <span className="w-3 h-3 inline-block shadow-sm shrink-0" style={{ backgroundColor: s.fill }}></span>
                                                                        <span className="text-sm font-medium text-slate-300 leading-none whitespace-nowrap">{s.name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    True Positive Rate to Threshold
                                                </span>
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                                                <YAxis type="number" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                                                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} />
                                                {confusionSeries.map((s, idx) => (
                                                    <Area key={s.name} name={s.name} data={s.data} dataKey="tpr" fill="transparent" stroke={s.fill} strokeWidth={2} type="monotone" />
                                                ))}
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button size="sm" variant="ghost" onClick={() => handleCopyChart(tprChartRef, 'tpr')} className="hover:bg-blue-800/50 font-normal text-[#9EA4B0] h-8" disabled={isCopying['tpr']} data-html2canvas-ignore="true">
                                            {copySuccess['tpr'] ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> <span>Copy Chart</span></>}
                                        </Button>
                                    </div>
                                </div>

                                {/* 5. True Negative Rate to Threshold */}
                                <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={tnrChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                    <div className="relative group inline-flex items-center cursor-help">
                                                        <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                        <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                            <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2">
                                                                {rocSeries.map((s) => (
                                                                    <div key={s.name} className="flex items-center gap-2">
                                                                        <span className="w-3 h-3 inline-block shadow-sm shrink-0" style={{ backgroundColor: s.fill }}></span>
                                                                        <span className="text-sm font-medium text-slate-300 leading-none whitespace-nowrap">{s.name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    True Negative Rate to Threshold
                                                </span>
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                                                <YAxis type="number" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                                                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} />
                                                {confusionSeries.map((s, idx) => (
                                                    <Area key={s.name} name={s.name} data={s.data} dataKey="tnr" fill="transparent" stroke={s.fill} strokeWidth={2} type="monotone" />
                                                ))}
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button size="sm" variant="ghost" onClick={() => handleCopyChart(tnrChartRef, 'tnr')} className="hover:bg-blue-800/50 font-normal text-[#9EA4B0] h-8" disabled={isCopying['tnr']} data-html2canvas-ignore="true">
                                            {copySuccess['tnr'] ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> <span>Copy Chart</span></>}
                                        </Button>
                                    </div>
                                </div>

                                {/* 6. False Positive Rate to Threshold */}
                                <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={fprChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                    <div className="relative group inline-flex items-center cursor-help">
                                                        <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                        <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                            <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2">
                                                                {rocSeries.map((s) => (
                                                                    <div key={s.name} className="flex items-center gap-2">
                                                                        <span className="w-3 h-3 inline-block shadow-sm shrink-0" style={{ backgroundColor: s.fill }}></span>
                                                                        <span className="text-sm font-medium text-slate-300 leading-none whitespace-nowrap">{s.name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    False Positive Rate to Threshold
                                                </span>
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                                                <YAxis type="number" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                                                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} />
                                                {confusionSeries.map((s, idx) => (
                                                    <Area key={s.name} name={s.name} data={s.data} dataKey="fpr" fill="transparent" stroke={s.fill} strokeWidth={2} type="monotone" />
                                                ))}
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button size="sm" variant="ghost" onClick={() => handleCopyChart(fprChartRef, 'fpr')} className="hover:bg-blue-800/50 font-normal text-[#9EA4B0] h-8" disabled={isCopying['fpr']} data-html2canvas-ignore="true">
                                            {copySuccess['fpr'] ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> <span>Copy Chart</span></>}
                                        </Button>
                                    </div>
                                </div>

                                {/* 7. False Negative Rate to Threshold */}
                                <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm md:col-span-2" ref={fnrChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                    <div className="relative group inline-flex items-center cursor-help">
                                                        <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                        <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                            <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2">
                                                                {rocSeries.map((s) => (
                                                                    <div key={s.name} className="flex items-center gap-2">
                                                                        <span className="w-3 h-3 inline-block shadow-sm shrink-0" style={{ backgroundColor: s.fill }}></span>
                                                                        <span className="text-sm font-medium text-slate-300 leading-none whitespace-nowrap">{s.name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    False Negative Rate to Threshold
                                                </span>
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                                                <YAxis type="number" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                                                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} />
                                                {confusionSeries.map((s, idx) => (
                                                    <Area key={s.name} name={s.name} data={s.data} dataKey="fnr" fill="transparent" stroke={s.fill} strokeWidth={2} type="monotone" />
                                                ))}
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button size="sm" variant="ghost" onClick={() => handleCopyChart(fnrChartRef, 'fnr')} className="hover:bg-blue-800/50 font-normal text-[#9EA4B0] h-8" disabled={isCopying['fnr']} data-html2canvas-ignore="true">
                                            {copySuccess['fnr'] ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> <span>Copy Chart</span></>}
                                        </Button>
                                    </div>
                                </div>

                            </div>
                        </>
                    )}
                </div>
            )}
        </PageContainer>
    );
};

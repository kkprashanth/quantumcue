import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft, BarChart3, Activity, Zap, Check, Square,
    ChevronRight, ArrowRight as ArrowRightRight, LineChart as LineChartIcon,
    Crosshair, Percent, Target, Copy, Info
} from 'lucide-react';
// Removed PageContainer
import { getMetricsData } from '@/utils/metricsData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useModel, useModels } from '@/hooks/useModels';
import { apiClient } from '@/api/client';
import html2canvas from 'html2canvas';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell,
    ScatterChart, Scatter, ZAxis, ComposedChart, RadialBarChart, RadialBar,
    BarChart, Bar
} from 'recharts';
import { CustomTooltip } from '@/components/charts';

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#3b82f6'];

export const ModelCompare = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [step, setStep] = useState<'selection' | 'results'>('selection');
    const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
    const [selectedClassIndex, setSelectedClassIndex] = useState<number>(0);
    const [metricViewMode, setMetricViewMode] = useState<'average' | 'per_class'>('average');

    const [providerFilter, setProviderFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'last_7_days', 'last_30_days', 'custom'
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');


    const rocChartRef = React.useRef<HTMLDivElement>(null);
    const prChartRef = React.useRef<HTMLDivElement>(null);
    const f1ChartRef = React.useRef<HTMLDivElement>(null);
    const posChartRef = React.useRef<HTMLDivElement>(null);
    const tprChartRef = React.useRef<HTMLDivElement>(null);
    const tnrChartRef = React.useRef<HTMLDivElement>(null);
    const fprChartRef = React.useRef<HTMLDivElement>(null);
    const fnrChartRef = React.useRef<HTMLDivElement>(null);

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

    // Fetch current model
    const { data: currentModel, isLoading: isLoadingCurrent } = useModel(id || null);

    // Fetch all available models for comparison
    const { data: allModelsList, isLoading: isLoadingList } = useModels();

    // Derived unique providers for filter options
    const providerOptions = useMemo(() => {
        if (!allModelsList || !('models' in allModelsList)) return [];
        const providers = new Set<string>();
        (allModelsList.models as any[]).forEach((m: any) => {
            if (m.provider_name) providers.add(m.provider_name);
        });
        return Array.from(providers).sort();
    }, [allModelsList]);

    // Only show ready/hosted models to compare against, excluding current, matching filters, and sorted by confidence
    const availableModels = useMemo(() => {
        if (!allModelsList || !('models' in allModelsList)) return [];

        let filtered = (allModelsList.models as any[]).filter((m: any) =>
            m.id !== id &&
            (m.status === 'ready' || m.status === 'hosted_active')
        );

        // Apply Provider Filter
        if (providerFilter !== 'all') {
            filtered = filtered.filter((m: any) => m.provider_name === providerFilter);
        }

        // Apply Date Filter
        if (dateFilter !== 'all') {
            const now = new Date();
            let startDate: Date | null = null;
            let endDate: Date | null = null;

            if (dateFilter === 'last_7_days') {
                startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            } else if (dateFilter === 'last_30_days') {
                startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            } else if (dateFilter === 'custom') {
                if (customStartDate) startDate = new Date(customStartDate);
                if (customEndDate) {
                    endDate = new Date(customEndDate);
                    // Include the whole end day
                    endDate.setHours(23, 59, 59, 999);
                }
            }

            filtered = filtered.filter((m: any) => {
                const createdAt = new Date(m.created_at);
                if (startDate && createdAt < startDate) return false;
                if (endDate && createdAt > endDate) return false;
                return true;
            });
        }

        return filtered.sort((a, b) => {
            const confA = a.average_confidence != null ? a.average_confidence : -1;
            const confB = b.average_confidence != null ? b.average_confidence : -1;
            return confB - confA;
        });

    }, [allModelsList, id, providerFilter, dateFilter, customStartDate, customEndDate]);

    const handleToggleModel = (modelId: string) => {
        setSelectedModelIds(prev =>
            prev.includes(modelId)
                ? prev.filter(mId => mId !== modelId)
                : [...prev, modelId]
        );
    };

    const handleCompare = () => {
        if (selectedModelIds.length > 0) {
            setStep('results');
        }
    };

    const metricsDefinitions = [
        { key: 'accuracy', label: 'Average Accuracy', description: 'Overall correct predictions.' },
        { key: 'precision', label: 'Average Precision', description: 'Exactness of the model.' },
        { key: 'auc_roc', label: 'Average AUC-ROC', description: 'Area under ROC curve.' },
        { key: 'auc_pr', label: 'Average AUC-PR', description: 'Area under PR curve.' },
        { key: 'max_f1', label: 'Average Max F1', description: 'Best balance across thresholds.' }
    ];

    const generateRadialData = (metricKey: string, metricIndex: number) => {
        return scalarMetricsData.map((model, idx) => ({
            name: model.name,
            provider: model.provider,
            value: parseFloat(model[metricKey as keyof typeof model] as string) || 0,
            fill: CHART_COLORS[(idx + metricIndex) % CHART_COLORS.length]
        }));
    };

    // Queries for stats
    const modelIdsToFetch = useMemo(() => {
        if (step !== 'results') return [];
        return [id as string, ...selectedModelIds];
    }, [step, id, selectedModelIds]);

    const statsQueries = useQuery({
        queryKey: ['compare-stats', modelIdsToFetch],
        queryFn: async () => {
            const statsPromises = modelIdsToFetch.map(mId =>
                apiClient.get(`/models/${mId}/stats`).then(res => res.data).catch(() => null)
            );
            const results = await Promise.all(statsPromises);

            return modelIdsToFetch.reduce((acc, mId, idx) => {
                // Here we mock the new schema structure if the backend doesn't provide it yet
                // In real life, `results[idx]` would contain { metrics, curves } from the new API
                const rawStats = results[idx] || {};

                const modelInfo = mId === currentModel?.id ? currentModel : availableModels.find((m: any) => m.id === mId);
                const mockSchema = getMetricsData(mId, modelInfo?.name, modelInfo?.configuration?.provider as string || modelInfo?.provider_name);

                acc[mId] = {
                    ...rawStats,
                    ...mockSchema // overrides with mock metrics & curves for demonstration
                };
                return acc;
            }, {} as Record<string, any>);
        },
        enabled: step === 'results' && modelIdsToFetch.length > 0,
    });

    if (isLoadingCurrent || isLoadingList) {
        return (
            <div className="w-full">
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (!currentModel) {
        return (
            <div className="w-full">
                <div className="text-center py-12">
                    <p className="text-status-error">Model not found</p>
                </div>
            </div>
        );
    }

    // --- CHART DATA PREPARATION ---

    // 1. Scalar Metrics (Avg over all classes for the Bar Charts)
    const scalarMetricsData = (() => {
        if (!statsQueries.data) return [];

        return modelIdsToFetch.map(mId => {
            const modelInfo = mId === currentModel.id ? currentModel : availableModels.find((m: any) => m.id === mId);
            const stats = statsQueries.data[mId];

            // Average the arrays to get a single scalar for the bar chart
            const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

            return {
                name: modelInfo?.name || mId.substring(0, 8),
                provider: modelInfo?.provider_name || 'Generic',
                accuracy: stats?.metrics?.accuracy ? (avg(stats.metrics.accuracy) * 100).toFixed(1) : 0,
                precision: stats?.metrics?.precision ? (avg(stats.metrics.precision) * 100).toFixed(1) : 0,
                auc_roc: stats?.metrics?.auc_roc ? (avg(stats.metrics.auc_roc) * 100).toFixed(1) : 0,
                auc_pr: stats?.metrics?.auc_pr ? (avg(stats.metrics.auc_pr) * 100).toFixed(1) : 0,
                max_f1: stats?.metrics?.max_f1 ? (avg(stats.metrics.max_f1) * 100).toFixed(1) : 0,
                isCurrent: mId === currentModel.id
            };
        });
    })();

    const numClasses = (id && statsQueries.data?.[id]?.numClasses) || 4;

    // 1b. Per-Class Metrics Data (Grouped Bar Chart Data)
    const perClassMetricsData = (() => {
        if (!statsQueries.data) return {} as Record<string, any[]>;

        const dataByMetric: Record<string, any[]> = {
            accuracy: [],
            precision: [],
            auc_roc: [],
            auc_pr: [],
            max_f1: []
        };

        for (let classIdx = 0; classIdx < numClasses; classIdx++) {
            const classRow: Record<string, any> = {
                accuracy: { className: `Class ${classIdx}` },
                precision: { className: `Class ${classIdx}` },
                auc_roc: { className: `Class ${classIdx}` },
                auc_pr: { className: `Class ${classIdx}` },
                max_f1: { className: `Class ${classIdx}` }
            };

            modelIdsToFetch.forEach(mId => {
                const modelInfo = mId === currentModel?.id ? currentModel : availableModels.find((m: any) => m.id === mId);
                const name = modelInfo?.name || mId.substring(0, 8);
                const stats = statsQueries.data[mId];

                Object.keys(dataByMetric).forEach(metric => {
                    const value = stats?.metrics?.[metric]?.[classIdx];
                    classRow[metric][name] = value != null ? (value * 100).toFixed(1) : 0;
                });
            });

            Object.keys(dataByMetric).forEach(metric => {
                dataByMetric[metric].push(classRow[metric]);
            });
        }

        return dataByMetric;
    })();

    // 2. F1 Curve Data
    const f1Series = modelIdsToFetch.flatMap((mId, mIdx) => {
        const stats = statsQueries.data?.[mId];
        const name = mId === currentModel.id ? currentModel.name : (availableModels.find((m: any) => m.id === mId)?.name || mId);

        const indices = metricViewMode === 'per_class'
            ? Array.from({ length: stats?.numClasses || 4 }, (_, i) => i)
            : [selectedClassIndex];

        return indices.map((idx) => {
            const data = [];
            if (stats?.curves?.f1) {
                const thresholds = stats.curves.f1.thresholds;
                const scores = stats.curves.f1.scores[idx] || [];
                for (let i = 0; i < thresholds.length; i++) {
                    data.push({ x: thresholds[i], y: scores[i] });
                }
            }
            const label = metricViewMode === 'per_class' ? `${name} (Class ${idx})` : name;
            // Shift color based on class index if in per_class mode to distinguish
            const colorIdx = (mIdx + (metricViewMode === 'per_class' ? idx * 2 : 0)) % CHART_COLORS.length;
            return { name: label, data, fill: CHART_COLORS[colorIdx] };
        });
    });

    // 3. ROC Curve Data (TPR vs FPR)
    const rocSeries = modelIdsToFetch.flatMap((mId, mIdx) => {
        const stats = statsQueries.data?.[mId];
        const name = mId === currentModel.id ? currentModel.name : (availableModels.find((m: any) => m.id === mId)?.name || mId);

        const indices = metricViewMode === 'per_class'
            ? Array.from({ length: stats?.numClasses || 4 }, (_, i) => i)
            : [selectedClassIndex];

        return indices.map((idx) => {
            const data = [];
            if (stats?.curves?.roc && stats.curves.roc[idx]) {
                const curve = stats.curves.roc[idx];
                for (let i = 0; i < curve.fpr.length; i++) {
                    data.push({ x: curve.fpr[i], y: curve.tpr[i] });
                }
            }
            const label = metricViewMode === 'per_class' ? `${name} (Class ${idx})` : name;
            const colorIdx = (mIdx + (metricViewMode === 'per_class' ? idx * 2 : 0)) % CHART_COLORS.length;
            return { name: label, data, fill: CHART_COLORS[colorIdx] };
        });
    });

    // 4. Precision-Recall Data
    const prSeries = modelIdsToFetch.flatMap((mId, mIdx) => {
        const stats = statsQueries.data?.[mId];
        const name = mId === currentModel.id ? currentModel.name : (availableModels.find((m: any) => m.id === mId)?.name || mId);

        const indices = metricViewMode === 'per_class'
            ? Array.from({ length: stats?.numClasses || 4 }, (_, i) => i)
            : [selectedClassIndex];

        return indices.map((idx) => {
            const data: any[] = [];
            if (stats?.curves?.pr && stats.curves.pr[idx]) {
                const curve = stats.curves.pr[idx];
                for (let i = 0; i < curve.recall.length; i++) {
                    data.push({ x: curve.recall[i], y: curve.precision[i] });
                }
            }
            const label = metricViewMode === 'per_class' ? `${name} (Class ${idx})` : name;
            const colorIdx = (mIdx + (metricViewMode === 'per_class' ? idx * 2 : 0)) % CHART_COLORS.length;
            return { name: label, data, fill: CHART_COLORS[colorIdx] };
        });
    });

    // 5. Positive Rates Data (TPR / FPR vs Threshold)
    const confusionSeries = modelIdsToFetch.flatMap((mId, mIdx) => {
        const stats = statsQueries.data?.[mId];
        const name = mId === currentModel.id ? currentModel.name : (availableModels.find((m: any) => m.id === mId)?.name || mId);

        const indices = metricViewMode === 'per_class'
            ? Array.from({ length: stats?.numClasses || 4 }, (_, i) => i)
            : [selectedClassIndex];

        return indices.map((idx) => {
            let data: any[] = [];
            if (stats?.curves?.confusion_rates) {
                const cr = stats.curves.confusion_rates;
                const tpr = cr.tpr[idx] || [];
                const fpr = cr.fpr[idx] || [];
                const tnr = cr.tnr[idx] || [];
                const fnr = cr.fnr[idx] || [];
                data = cr.thresholds.map((x: number, i: number) => ({ x, tpr: tpr[i], fpr: fpr[i], tnr: tnr[i], fnr: fnr[i] }));
            }
            const label = metricViewMode === 'per_class' ? `${name} (Class ${idx})` : name;
            const colorIdx = (mIdx + (metricViewMode === 'per_class' ? idx * 2 : 0)) % CHART_COLORS.length;
            return { name: label, data, fill: CHART_COLORS[colorIdx] };
        });
    });

    const formatDec = (val: number) => val.toFixed(3);
    const formatPct = (val: number) => val.toFixed(1);

    const RadialTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[180px] z-[100]">
                    <p className="font-semibold text-white mb-1">
                        {data.name}
                    </p>
                    <p className="text-xs text-slate-400 mb-2 pb-2 border-b border-slate-700">
                        {data.provider}
                    </p>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-slate-300">Value:</span>
                        <span className="font-mono font-bold text-white text-sm" style={{ color: payload[0].fill }}>
                            {formatPct(data.value)}%
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

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
        <div className="w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    {step === 'results' && (
                        <button
                            onClick={() => setStep('selection')}
                            className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-2"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">
                                Back to Selection
                            </span>
                        </button>
                    )}
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3 my-5">
                        <LineChartIcon className="text-brand-50 w-8 h-8" />
                        Compare Performance
                    </h1>
                    <p className="text-gray-500 mt-3">
                        Evaluating <strong className="text-gray-900">{currentModel.name}</strong> against other models
                    </p>
                </div>
            </div>

            {step === 'selection' && (
                <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
                    <Card className="p-8 sm:p-10 bg-white/50 backdrop-blur-xl border-dashed border-gray-200">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shadow-lg shadow-brand-50/20">
                                <span className="text-white font-bold text-lg">1</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                                    Select Models to Compare
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Choose one or more alternative models from your workspace to benchmark against the current model.
                                </p>
                            </div>
                        </div>

                        {availableModels.length === 0 && providerFilter === 'all' && dateFilter === 'all' ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No other models available</h3>
                                <p className="text-gray-500">You need at least one other ready/hosted model to run a comparison.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                                    <div className="px-4 text-sm font-medium text-gray-600">
                                        <span className="font-bold text-lg">{availableModels.length}</span> models available
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-brand-50/20 focus-within:border-brand-50">
                                            <div className="px-3 py-2 border-r border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 object-fill">
                                                Provider
                                            </div>
                                            <select
                                                value={providerFilter}
                                                onChange={(e) => setProviderFilter(e.target.value)}
                                                className="text-sm border-0 focus:ring-0 cursor-pointer bg-transparent py-2 pl-3 pr-8 font-semibold text-gray-800"
                                            >
                                                <option value="all">All</option>
                                                {providerOptions.map(provider => (
                                                    <option key={provider} value={provider}>{provider}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-brand-50/20 focus-within:border-brand-50">
                                            <div className="px-3 py-2 border-r border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                                By Date
                                            </div>
                                            <select
                                                value={dateFilter}
                                                onChange={(e) => setDateFilter(e.target.value)}
                                                className="text-sm border-0 focus:ring-0 cursor-pointer bg-transparent py-2 pl-3 pr-8 font-semibold text-gray-800"
                                            >
                                                <option value="all">All Time</option>
                                                <option value="last_7_days">Last 7 Days</option>
                                                <option value="last_30_days">Last 30 Days</option>
                                                <option value="custom">Custom Range</option>
                                            </select>
                                        </div>

                                        {dateFilter === 'custom' && (
                                            <>
                                                <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-brand-50/20 focus-within:border-brand-50">
                                                    <div className="px-3 py-2 border-r border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                                        Start
                                                    </div>
                                                    <input
                                                        type="date"
                                                        value={customStartDate}
                                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                                        className="text-sm border-0 focus:ring-0 bg-transparent py-1.5 px-3 font-semibold text-gray-800 outline-none"
                                                    />
                                                </div>
                                                <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-brand-50/20 focus-within:border-brand-50">
                                                    <div className="px-3 py-2 border-r border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                                        End
                                                    </div>
                                                    <input
                                                        type="date"
                                                        value={customEndDate}
                                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                                        className="text-sm border-0 focus:ring-0 bg-transparent py-1.5 px-3 font-semibold text-gray-800 outline-none"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {availableModels.length === 0 && (providerFilter !== 'all' || dateFilter !== 'all') ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No models match the selected filters.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {availableModels.map((model: any) => {
                                            const isSelected = selectedModelIds.includes(model.id);
                                            return (
                                                <div
                                                    key={model.id}
                                                    onClick={() => handleToggleModel(model.id)}
                                                    className={`
                                                        relative overflow-hidden group p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-start gap-4
                                                        ${isSelected
                                                            ? 'border-brand-50 bg-white shadow-md shadow-brand-50/10'
                                                            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}
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
                                                                {model.name}
                                                            </h4>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                                            <span className="text-xs px-2.5 py-1 bg-gray-100/80 text-gray-600 rounded-md font-medium tracking-wide">
                                                                {model.provider_name || 'Generic'}
                                                            </span>
                                                            <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-md font-medium tracking-wide">
                                                                {model.status.replace('_', ' ')}
                                                            </span>
                                                            {model.average_confidence != null && (
                                                                <span className="text-xs px-2.5 py-1 bg-brand-50/10 text-brand-700 rounded-md font-bold tracking-wide flex items-center gap-1.5">
                                                                    <Target className="w-3.5 h-3.5" />
                                                                    {(model.average_confidence * 100).toFixed(1)}% Conf.
                                                                </span>
                                                            )}
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
                                        disabled={selectedModelIds.length === 0}
                                        className="px-8 bg-brand-50 gap-2"
                                    >
                                        Run Comparison <ArrowRightRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}


            {step === 'results' && (
                <div className="space-y-8 animate-fade-in">

                    {statsQueries.isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <LoadingSpinner />
                            <p className="mt-4 text-gray-500 font-medium animate-pulse">Aggregating complex comparison metrics...</p>
                        </div>
                    ) : (
                        <>
                            {/* Top Control Bar */}
                            {/* <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
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
                                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${selectedClassIndex === i
                                                    ? 'bg-white text-brand-50 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-900'
                                                    }`}
                                            >
                                                Class {i}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div> */}

                            {/* Summary Scalar Radial Charts (Average across all classes) */}
                            <div className="mt-8 mb-8">
                                <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-black">Metrics</h3>
                                    <div className="flex bg-gray-100 p-1 rounded-lg mt-4 md:mt-0">
                                        {/* <button
                                            onClick={() => setMetricViewMode('average')}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${metricViewMode === 'average' ? 'bg-white text-brand-50 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                        >
                                            Average
                                        </button> */}
                                        {/* <button
                                            onClick={() => setMetricViewMode('per_class')}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${metricViewMode === 'per_class' ? 'bg-white text-brand-50 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                        >
                                            By Class
                                        </button> */}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                                    {metricsDefinitions.map((metric, metricIndex) => {
                                        const chartData = generateRadialData(metric.key, metricIndex).sort((a, b) => a.value - b.value);
                                        const classChartData = perClassMetricsData[metric.key] || [];

                                        return (
                                            <div key={metric.key} className="bg-[#172554] border border-blue-900/30 rounded-xl p-5 shadow-sm flex flex-col items-center">
                                                <div className="text-center w-full mb-2">
                                                    <h4 className="text-[15px] font-bold text-white mb-1">{metric.label.replace('Average ', '')}</h4>
                                                    <p className="text-xs text-blue-200/60 leading-tight">
                                                        {metricViewMode === 'average' ? metric.description : `Per-class ${metric.key.replace('_', ' ')}.`}
                                                    </p>
                                                </div>

                                                <div className="h-[220px] w-full flex items-center justify-center relative">
                                                    {/* Central Data value display can go here if we wanted to show a total/average of averages, but standard radial doesn't need it */}
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        {metricViewMode === 'average' ? (
                                                            <RadialBarChart
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius="20%"
                                                                outerRadius="100%"
                                                                barSize={20}
                                                                data={chartData}
                                                                startAngle={-270}
                                                                endAngle={90}
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
                                                                    content={<RadialTooltip />}
                                                                    cursor={{ fill: 'transparent' }}
                                                                    wrapperStyle={{ zIndex: 1000 }}
                                                                />
                                                            </RadialBarChart>
                                                        ) : (
                                                            <BarChart data={classChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                                                <XAxis dataKey="className" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                                                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                                                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white' }} itemStyle={{ color: 'white' }} formatter={(val: any) => [`${val}%`]} />
                                                                {modelIdsToFetch.map((mId, idx) => {
                                                                    const modelInfo = mId === currentModel?.id ? currentModel : availableModels.find((m: any) => m.id === mId);
                                                                    const name = modelInfo?.name || mId.substring(0, 8);
                                                                    return <Bar key={name} dataKey={name} fill={CHART_COLORS[(idx + metricIndex) % CHART_COLORS.length]} radius={[2, 2, 0, 0]} />;
                                                                })}
                                                            </BarChart>
                                                        )}
                                                    </ResponsiveContainer>
                                                </div>

                                                {/* Custom Legend inside the card */}
                                                <div className="w-full mt-2 grid grid-cols-1 gap-1.5 px-2">
                                                    {[...chartData].reverse().map((dataItem, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-xs">
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={rocChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                                                    <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                        <div className="relative group inline-flex items-center cursor-help">
                                                            <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                                <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2 font-normal">
                                                                    {rocSeries.map((s) => (
                                                                        <div key={s.name} className="flex items-center gap-2">
                                                                            <span className="w-3 h-3 inline-block shadow-sm shrink-0" style={{ backgroundColor: s.fill }}></span>
                                                                            <span className="text-sm font-medium text-slate-300 leading-none whitespace-nowrap">{s.name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        Receiver Operating Characteristic Curve
                                                    </span>
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 xl:gap-6 text-sm text-gray-400 font-medium justify-end">

                                        </div>
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <defs>
                                                    {rocSeries.map((s, idx) => (
                                                        <linearGradient id={`color-roc-${idx}`} x1="0" y1="0" x2="0" y2="1" key={s.name}>
                                                            <stop offset="5%" stopColor={s.fill} stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                                <XAxis
                                                    type="number"
                                                    dataKey="x"
                                                    name="False Positive Rate"
                                                    domain={[0, 1]}
                                                    tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }}
                                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                                    tickLine={false}
                                                    label={{
                                                        value: 'False Positive Rate',
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
                                                    name="True Positive Rate"
                                                    domain={[0, 1]}
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                    tickFormatter={(val) => val === 0 ? '' : val}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    label={{
                                                        value: 'True Positive Rate',
                                                        angle: -90,
                                                        position: 'insideLeft',
                                                        fill: '#94a3b8',
                                                        fontSize: 16,
                                                        style: { textAnchor: 'middle' },
                                                        offset: 5,
                                                        fontWeight: 'bold',
                                                    }}
                                                />
                                                <RechartsTooltip content={<DarkTooltip xLabel="False Positive Rate" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />

                                                {rocSeries.map((s, idx) => (
                                                    <Area key={s.name} name={s.name} data={s.data} dataKey="y" fill={`url(#color-roc-${idx})`} stroke={s.fill} strokeWidth={2} type="monotone" isAnimationActive={true} />
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

                                {/* 2. Precision-Recall */}
                                <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={prChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                                                    <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                        <div className="relative group inline-flex items-center cursor-help">
                                                            <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                                <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2 font-normal">
                                                                    {prSeries.map((s) => (
                                                                        <div key={s.name} className="flex items-center gap-2">
                                                                            <span className="w-3 h-3 inline-block shadow-sm shrink-0" style={{ backgroundColor: s.fill }}></span>
                                                                            <span className="text-sm font-medium text-slate-300 leading-none whitespace-nowrap">{s.name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        Precision Recall Curve
                                                    </span>
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 xl:gap-6 text-sm text-gray-400 font-medium justify-end">

                                        </div>
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <defs>
                                                    {prSeries.map((s, idx) => (
                                                        <linearGradient id={`color-pr-${idx}`} x1="0" y1="0" x2="0" y2="1" key={s.name}>
                                                            <stop offset="5%" stopColor={s.fill} stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
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
                                                <RechartsTooltip content={<DarkTooltip xLabel="Recall" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />

                                                {prSeries.map((s, idx) => (
                                                    <Area key={s.name} name={s.name} data={s.data} dataKey="y" fill={`url(#color-pr-${idx})`} stroke={s.fill} strokeWidth={2} type="monotone" isAnimationActive={true} />
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

                                <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={f1ChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                                                    <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                        <div className="relative group inline-flex items-center cursor-help">
                                                            <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                                <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2 font-normal">
                                                                    {f1Series.map((s) => (
                                                                        <div key={s.name} className="flex items-center gap-2">
                                                                            <span className="w-3 h-3 inline-block shadow-sm shrink-0" style={{ backgroundColor: s.fill }}></span>
                                                                            <span className="text-sm font-medium text-slate-300 leading-none whitespace-nowrap">{s.name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        F1 Score/Threshold
                                                    </span>
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 xl:gap-6 text-sm text-gray-400 font-medium justify-end">

                                        </div>
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <defs>
                                                    {f1Series.map((s, idx) => (
                                                        <linearGradient id={`color-f1-${idx}`} x1="0" y1="0" x2="0" y2="1" key={s.name}>
                                                            <stop offset="5%" stopColor={s.fill} stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
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
                                                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />

                                                {f1Series.map((s, idx) => (
                                                    <Area key={s.name} name={s.name} data={s.data} dataKey="y" fill={`url(#color-f1-${idx})`} stroke={s.fill} strokeWidth={2} type="monotone" isAnimationActive={true} />
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

                                {/* <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={posChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                                                    <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                        <div className="relative group inline-flex items-center cursor-help">
                                                            <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                                <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2 font-normal">
                                                                    {confusionSeries.map((s) => (
                                                                        <div key={s.name} className="flex items-center gap-2">
                                                                            <span className="w-3 h-3 inline-block shadow-sm shrink-0" style={{ backgroundColor: s.fill }}></span>
                                                                            <span className="text-sm font-medium text-slate-300 leading-none whitespace-nowrap">{s.name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        Positive Rates
                                                    </span>
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 xl:gap-6 text-sm text-gray-400 font-medium justify-end">

                                        </div>
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
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
                                                    domain={[0, 1]}
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                    tickFormatter={(val) => val === 0 ? '' : val}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    label={{
                                                        value: 'Rate',
                                                        angle: -90,
                                                        position: 'insideLeft',
                                                        fill: '#94a3b8',
                                                        fontSize: 16,
                                                        style: { textAnchor: 'middle' },
                                                        offset: 5,
                                                        fontWeight: 'bold',
                                                    }}
                                                />
                                                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                                                {confusionSeries.map((s) => (
                                                    <Area key={`${s.name}-tpr`} name={`${s.name} (TPR)`} data={s.data} dataKey="tpr" fill="transparent" stroke={s.fill} strokeWidth={2} type="monotone" strokeDasharray="5 5" />
                                                ))}
                                                {confusionSeries.map((s) => (
                                                    <Area key={`${s.name}-fpr`} name={`${s.name} (FPR)`} data={s.data} dataKey="fpr" fill="transparent" stroke={s.fill} strokeWidth={2} type="monotone" />
                                                ))}
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleCopyChart(posChartRef, 'pos')}
                                            className="hover:bg-blue-800/50 font-normal text-[#9EA4B0] h-8"
                                            disabled={isCopying['pos']}
                                            data-html2canvas-ignore="true"
                                        >
                                            {copySuccess['pos'] ? (
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
                                </div> */}


                                {/* True Positive Rate to Threshold */}
                                <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={tprChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                                                    <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                        <div className="relative group inline-flex items-center cursor-help">
                                                            <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                                <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2 font-normal">
                                                                    {confusionSeries.map((s) => (
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
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <defs>
                                                    {confusionSeries.map((s, idx) => (
                                                        <linearGradient id={`color-tpr-${idx}`} x1="0" y1="0" x2="0" y2="1" key={s.name}>
                                                            <stop offset="5%" stopColor={s.fill} stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                                <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                                                <YAxis type="number" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                                                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                                                {confusionSeries.map((s, idx) => (
                                                    <Area key={s.name} name={s.name} data={s.data} dataKey="tpr" fill={`url(#color-tpr-${idx})`} stroke={s.fill} strokeWidth={2} type="monotone" isAnimationActive={true} />
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

                                {/* True Negative Rate to Threshold */}
                                <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={tnrChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                                                    {/* <div className="p-2 bg-blue-500/20 rounded-lg flex items-center justify-center h-9 w-9 shrink-0">
                                                        <Target className="w-5 h-5 text-blue-400" />
                                                    </div> */}
                                                    <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                        <div className="relative group inline-flex items-center cursor-help">
                                                            <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                                <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2 font-normal">
                                                                    {confusionSeries.map((s) => (
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
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <defs>
                                                    {confusionSeries.map((s, idx) => (
                                                        <linearGradient id={`color-tnr-${idx}`} x1="0" y1="0" x2="0" y2="1" key={s.name}>
                                                            <stop offset="5%" stopColor={s.fill} stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                                <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                                                <YAxis type="number" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                                                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                                                {confusionSeries.map((s, idx) => (
                                                    <Area key={s.name} name={s.name} data={s.data} dataKey="tnr" fill={`url(#color-tnr-${idx})`} stroke={s.fill} strokeWidth={2} type="monotone" isAnimationActive={true} />
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

                                {/* False Positive Rate to Threshold */}
                                <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={fprChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                                                    {/* <div className="p-2 bg-blue-500/20 rounded-lg flex items-center justify-center h-9 w-9 shrink-0">
                                                        <Target className="w-5 h-5 text-blue-400" />
                                                    </div> */}
                                                    <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                        <div className="relative group inline-flex items-center cursor-help">
                                                            <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                                <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2 font-normal">
                                                                    {confusionSeries.map((s) => (
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
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <defs>
                                                    {confusionSeries.map((s, idx) => (
                                                        <linearGradient id={`color-fpr-${idx}`} x1="0" y1="0" x2="0" y2="1" key={s.name}>
                                                            <stop offset="5%" stopColor={s.fill} stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                                <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                                                <YAxis type="number" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                                                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                                                {confusionSeries.map((s, idx) => (
                                                    <Area key={s.name} name={s.name} data={s.data} dataKey="fpr" fill={`url(#color-fpr-${idx})`} stroke={s.fill} strokeWidth={2} type="monotone" isAnimationActive={true} />
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

                                {/* False Negative Rate to Threshold */}
                                <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm md:col-span-2" ref={fnrChartRef}>
                                    <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                                                    {/* <div className="p-2 bg-blue-500/20 rounded-lg flex items-center justify-center h-9 w-9 shrink-0">
                                                        <Target className="w-5 h-5 text-blue-400" />
                                                    </div> */}
                                                    <span className="inline-flex items-center gap-2 min-w-[150px]">
                                                        <div className="relative group inline-flex items-center cursor-help">
                                                            <Info className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-50">
                                                                <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl min-w-[150px] flex flex-col gap-2 font-normal">
                                                                    {confusionSeries.map((s) => (
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
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                                                <defs>
                                                    {confusionSeries.map((s, idx) => (
                                                        <linearGradient id={`color-fnr-${idx}`} x1="0" y1="0" x2="0" y2="1" key={s.name}>
                                                            <stop offset="5%" stopColor={s.fill} stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                                <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                                                <YAxis type="number" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                                                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                                                {confusionSeries.map((s, idx) => (
                                                    <Area key={s.name} name={s.name} data={s.data} dataKey="fnr" fill={`url(#color-fnr-${idx})`} stroke={s.fill} strokeWidth={2} type="monotone" isAnimationActive={true} />
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
        </div>
    );
};

export default ModelCompare;

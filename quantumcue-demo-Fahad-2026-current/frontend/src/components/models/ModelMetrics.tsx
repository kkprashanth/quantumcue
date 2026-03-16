import React, { useState, useMemo, useRef } from 'react';
import {
  Activity, Crosshair, Target, Copy, Check, Percent
} from 'lucide-react';
import {
  Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip,
  PolarAngleAxis, ComposedChart, RadialBarChart, RadialBar
} from 'recharts';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/Button';
import type { Model, ModelInteraction } from '@/types';
import { getMetricsData } from '@/utils/metricsData';

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#3b82f6'];

interface ModelMetricsProps {
  model: Model;
  interactions?: ModelInteraction[];
  totalInteractions?: number;
  realMetricsData?: any;
}

export const ModelMetrics = ({ model, interactions = [], totalInteractions, realMetricsData }: ModelMetricsProps) => {
  const [viewMode, setViewMode] = useState<'average' | 'per_class'>('average');

  const rocChartRef = useRef<HTMLDivElement>(null);
  const prChartRef = useRef<HTMLDivElement>(null);
  const f1ChartRef = useRef<HTMLDivElement>(null);
  const posChartRef = useRef<HTMLDivElement>(null);
  const tprChartRef = useRef<HTMLDivElement>(null);
  const tnrChartRef = useRef<HTMLDivElement>(null);
  const fprChartRef = useRef<HTMLDivElement>(null);
  const fnrChartRef = useRef<HTMLDivElement>(null);

  const [isCopying, setIsCopying] = useState<Record<string, boolean>>({});
  const [copySuccess, setCopySuccess] = useState<Record<string, boolean>>({});

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
        if (!blob) return;
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopySuccess(prev => ({ ...prev, [chartId]: true }));
          setTimeout(() => setCopySuccess(prev => ({ ...prev, [chartId]: false })), 2000);
        } catch (err) { }
      });
    } catch (err) {
    } finally {
      setIsCopying(prev => ({ ...prev, [chartId]: false }));
    }
  };

  const statsData = useMemo(() => {
    if (realMetricsData && Object.keys(realMetricsData).length > 0) {
      return realMetricsData;
    }
    return getMetricsData(model.id, model.name, model.configuration?.provider as string || model.provider_name || undefined);
  }, [model.id, model.name, realMetricsData]);

  const dbClasses = model.classes || model.classifications;
  const displayClasses = dbClasses && dbClasses.length > 0 ? dbClasses : ['Class 0', 'Class 1', 'Class 2', 'Class 3'];
  const numClasses = displayClasses.length;

  const metricsDefinitions = [
    { key: 'accuracy', label: 'Average Accuracy', description: 'Overall correct predictions.' },
    { key: 'precision', label: 'Average Precision', description: 'Exactness of the model.' },
    { key: 'auc_roc', label: 'Average AUC-ROC', description: 'Area under ROC curve.' },
    { key: 'auc_pr', label: 'Average AUC-PR', description: 'Area under PR curve.' },
    { key: 'max_f1', label: 'Average Max F1', description: 'Best balance across thresholds.' }
  ];

  const avg = (val: any, specVal?: any) => {
    if (typeof specVal === 'number') return specVal;
    if (typeof val === 'number') return val;
    if (Array.isArray(val) && val.length > 0) {
      return val.reduce((a: number, b: number) => a + b, 0) / val.length;
    }
    return 0;
  };

  const specs: Record<string, any> = statsData?.metrics?.specs || model.metrics?.specs || model.metrics || {};
  const perClassMetrics = model.evaluation_results?.per_class_metrics as Record<string, Record<string, any>> | undefined;

  const scalarMetricsData = {
    name: model.name,
    accuracy: (avg(statsData?.metrics?.accuracy, specs?.accuracy || specs?.final_accuracy) * 100).toFixed(1),
    precision: (avg(statsData?.metrics?.precision, specs?.precision) * 100).toFixed(1),
    auc_roc: (avg(statsData?.metrics?.auc_roc, specs?.['ROC-AUC']) * 100).toFixed(1),
    auc_pr: (avg(statsData?.metrics?.auc_pr, specs?.['PR-AUC'] || specs?.pr_auc) * 100).toFixed(1),
    max_f1: (avg(statsData?.metrics?.max_f1, specs?.F1 || specs?.f1_score) * 100).toFixed(1),
  };

  const generateRadialData = (metricKey: string, metricIndex: number) => {
    if (viewMode === 'average') {
      return [{
        name: model.name,
        value: parseFloat(scalarMetricsData[metricKey as keyof typeof scalarMetricsData] as string) || 0,
        fill: CHART_COLORS[metricIndex % CHART_COLORS.length]
      }];
    } else {
      let metricArr = statsData?.metrics?.[metricKey];

      if (metricArr === undefined) {
        if (perClassMetrics) {
          const keyMap: Record<string, string> = {
            'accuracy': 'accuracy',
            'precision': 'precision',
            'auc_roc': 'ROC-AUC',
            'auc_pr': 'PR-AUC',
            'max_f1': 'f1_score'
          };
          const pKey = keyMap[metricKey] || metricKey;
          metricArr = displayClasses.map(cls => {
            const clsMetrics = perClassMetrics[cls];
            if (clsMetrics && clsMetrics[pKey] !== undefined) {
              return clsMetrics[pKey];
            }
            return specs ? (specs[pKey] ?? specs[pKey.toLowerCase()]) : 0;
          });
        } else if (specs) {
          const keyMap: Record<string, string> = {
            'accuracy': 'accuracy',
            'precision': 'precision',
            'auc_roc': 'ROC-AUC',
            'auc_pr': 'PR-AUC',
            'max_f1': 'F1'
          };
          const specKey = keyMap[metricKey] || metricKey;
          metricArr = specs[specKey] ?? specs[specKey.toLowerCase()];
        }
      }

      return Array.from({ length: numClasses }, (_, i) => {
        let val = 0;
        if (metricArr !== undefined && metricArr !== null) {
          if (typeof metricArr === 'object' && !Array.isArray(metricArr) && i in metricArr) {
            val = (metricArr as any)[i];
          } else if (Array.isArray(metricArr)) {
            val = metricArr[i] !== undefined ? metricArr[i] : (metricArr[0] ?? 0);
          } else if (typeof metricArr === 'number') {
            val = metricArr;
          }
        }
        return {
          name: displayClasses[i] || `Class ${i}`,
          value: parseFloat((val * 100).toFixed(1)) || 0,
          fill: CHART_COLORS[i % CHART_COLORS.length]
        };
      }).sort((a, b) => a.value - b.value);
    }
  };

  // Curves
  const indices = viewMode === 'per_class' ? Array.from({ length: numClasses }, (_, i) => i) : [0];

  const f1Series = indices.map((idx) => ({
    name: viewMode === 'per_class' ? displayClasses[idx] || `Class ${idx}` : model.name,
    data: statsData?.curves?.f1?.thresholds?.map((t: number, i: number) => ({
      x: t,
      y: statsData.curves.f1.scores?.[idx]?.[i] ?? 0
    })) || [],
    fill: CHART_COLORS[idx % CHART_COLORS.length]
  }));

  const rocSeries = indices.map((idx) => {
    const rocData = statsData?.curves?.roc?.[idx];
    return {
      name: viewMode === 'per_class' ? displayClasses[idx] || `Class ${idx}` : model.name,
      data: rocData?.fpr?.map((fpr: number, i: number) => ({ x: fpr, y: rocData.tpr[i] })) || [],
      fill: CHART_COLORS[idx % CHART_COLORS.length]
    };
  });

  const prSeries = indices.map((idx) => {
    const prData = statsData?.curves?.pr?.[idx];
    return {
      name: viewMode === 'per_class' ? displayClasses[idx] || `Class ${idx}` : model.name,
      data: prData?.recall?.map((r: number, i: number) => ({ x: r, y: prData.precision[i] })) || [],
      fill: CHART_COLORS[idx % CHART_COLORS.length]
    };
  });

  const confusionSeries = indices.map((idx) => ({
    name: viewMode === 'per_class' ? displayClasses[idx] || `Class ${idx}` : model.name,
    data: statsData?.curves?.confusion_rates?.thresholds?.map((t: number, i: number) => ({
      x: t,
      tpr: statsData.curves.confusion_rates.tpr?.[idx]?.[i] ?? 0,
      fpr: statsData.curves.confusion_rates.fpr?.[idx]?.[i] ?? 0,
      tnr: statsData.curves.confusion_rates.tnr?.[idx]?.[i] ?? 0,
      fnr: statsData.curves.confusion_rates.fnr?.[idx]?.[i] ?? 0
    })) || [],
    fill: CHART_COLORS[idx % CHART_COLORS.length]
  }));

  const formatDec = (val: number) => val.toFixed(3);

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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-gray-700">{model.name}</span>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('average')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'average'
                ? 'bg-white text-brand-50 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              By Average
            </button>
            <button
              onClick={() => setViewMode('per_class')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'per_class'
                ? 'bg-white text-brand-50 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              By Classes
            </button>
          </div>
        </div>
      </div>

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
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-1">
                  <span className="text-xl font-black text-white tracking-tight">
                    {viewMode === 'average' ? `${scalarMetricsData[metric.key as keyof typeof scalarMetricsData]}%` : ''}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius={viewMode === 'average' ? "70%" : "30%"}
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
                      formatter={((value: any, name: any, props: any) => [`${value}%`, props.payload.name]) as any}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: 'white' }}
                      itemStyle={{ color: 'white' }}
                      cursor={{ fill: 'transparent' }}
                      wrapperStyle={{ zIndex: 1000 }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              {viewMode === 'per_class' && (
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
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ROC Curve */}
        <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={rocChartRef}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                <div className="p-2 bg-blue-500/20 rounded-lg flex items-center justify-center h-9 w-9 shrink-0">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <span className="inline-block align-middle pt-0.5 min-w-fit">Receiver Operating Characteristic Curve</span>
              </h3>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                <defs>
                  {rocSeries.map((s, idx) => (
                    <linearGradient key={`color-roc-${idx}`} id={`color-roc-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.fill} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis type="number" dataKey="x" name="False Positive Rate" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                <YAxis type="number" dataKey="y" name="True Positive Rate" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                <RechartsTooltip content={<DarkTooltip xLabel="False Positive Rate" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                {rocSeries.map((s, idx) => (
                  <Area key={idx} name={s.name} data={s.data} dataKey="y" fill={`url(#color-roc-${idx})`} stroke={s.fill} strokeWidth={2} type="monotone" isAnimationActive={true} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => handleCopyChart(rocChartRef, 'roc')} className="hover:bg-blue-800/50 font-normal text-[#9EA4B0] h-8" disabled={isCopying['roc']} data-html2canvas-ignore="true">
              {copySuccess['roc'] ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> <span>Copy Chart</span></>}
            </Button>
          </div>
        </div>

        {/* PR Curve */}
        <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={prChartRef}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                <div className="p-2 bg-blue-500/20 rounded-lg flex items-center justify-center h-9 w-9 shrink-0">
                  <Crosshair className="w-5 h-5 text-blue-400" />
                </div>
                <span className="inline-block align-middle pt-0.5 min-w-fit">PR Curve</span>
              </h3>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                <defs>
                  {prSeries.map((s, idx) => (
                    <linearGradient key={`color-pr-${idx}`} id={`color-pr-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.fill} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis type="number" dataKey="x" name="Recall" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Recall', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                <YAxis type="number" dataKey="y" name="Precision" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Precision', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                <RechartsTooltip content={<DarkTooltip xLabel="Recall" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                {prSeries.map((s, idx) => (
                  <Area key={idx} name={s.name} data={s.data} dataKey="y" fill={`url(#color-pr-${idx})`} stroke={s.fill} strokeWidth={2} type="monotone" isAnimationActive={true} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => handleCopyChart(prChartRef, 'pr')} className="hover:bg-blue-800/50 font-normal text-[#9EA4B0] h-8" disabled={isCopying['pr']} data-html2canvas-ignore="true">
              {copySuccess['pr'] ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> <span>Copy Chart</span></>}
            </Button>
          </div>
        </div>

        {/* F1 Curve */}
        <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={f1ChartRef}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                <div className="p-2 bg-blue-500/20 rounded-lg flex items-center justify-center h-9 w-9 shrink-0">
                  <Percent className="w-5 h-5 text-blue-400" />
                </div>
                <span className="inline-block align-middle pt-0.5 min-w-fit">F1 Score/Threshold</span>
              </h3>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                <defs>
                  {f1Series.map((s, idx) => (
                    <linearGradient key={`color-f1-${idx}`} id={`color-f1-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.fill} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                <YAxis type="number" dataKey="y" name="F1 Score" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'F1 Score', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                {f1Series.map((s, idx) => (
                  <Area key={idx} name={s.name} data={s.data} dataKey="y" fill={`url(#color-f1-${idx})`} stroke={s.fill} strokeWidth={2} type="monotone" isAnimationActive={true} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => handleCopyChart(f1ChartRef, 'f1')} className="hover:bg-blue-800/50 font-normal text-[#9EA4B0] h-8" disabled={isCopying['f1']} data-html2canvas-ignore="true">
              {copySuccess['f1'] ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> <span>Copy Chart</span></>}
            </Button>
          </div>
        </div>

        {/* Positive Rates */}
        {/* <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={posChartRef}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                <div className="p-2 bg-blue-500/20 rounded-lg flex items-center justify-center h-9 w-9 shrink-0">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <span className="inline-block align-middle pt-0.5 min-w-fit">Positive Rates</span>
              </h3>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                <YAxis type="number" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                <Area name={`${model.name} (TPR)`} data={confusionSeries[0].data} dataKey="tpr" fill="transparent" stroke={CHART_COLORS[0]} strokeWidth={2} type="monotone" strokeDasharray="5 5" />
                <Area name={`${model.name} (FPR)`} data={confusionSeries[0].data} dataKey="fpr" fill="transparent" stroke={CHART_COLORS[1] || '#06b6d4'} strokeWidth={2} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => handleCopyChart(posChartRef, 'pos')} className="font-normal text-[#9EA4B0] h-8" disabled={isCopying['pos']} data-html2canvas-ignore="true">
              {copySuccess['pos'] ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> <span>Copy Chart</span></>}
            </Button>
          </div>
        </div> */}


        {/* True Positive Rate to Threshold */}
        <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={tprChartRef}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                <div className="p-2 bg-blue-500/20 rounded-lg flex items-center justify-center h-9 w-9 shrink-0">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <span className="inline-block align-middle pt-0.5 min-w-fit">True Positive Rate to Threshold</span>
              </h3>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                <defs>
                  {confusionSeries.map((s, idx) => (
                    <linearGradient key={`color-tpr-${idx}`} id={`color-tpr-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.fill} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                <YAxis type="number" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                {confusionSeries.map((s, idx) => (
                  <Area key={idx} name={s.name} data={s.data} dataKey="tpr" fill={`url(#color-tpr-${idx})`} stroke={s.fill} strokeWidth={2} type="monotone" />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => handleCopyChart(tprChartRef, 'tpr')} className="font-normal text-[#9EA4B0] h-8" disabled={isCopying['tpr']} data-html2canvas-ignore="true">
              {copySuccess['tpr'] ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> <span>Copy Chart</span></>}
            </Button>
          </div>
        </div>

        {/* True Negative Rate to Threshold */}
        <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={tnrChartRef}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                <div className="p-2 bg-blue-500/20 rounded-lg flex items-center justify-center h-9 w-9 shrink-0">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <span className="inline-block align-middle pt-0.5 min-w-fit">True Negative Rate to Threshold</span>
              </h3>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                <defs>
                  {confusionSeries.map((s, idx) => (
                    <linearGradient key={`color-tnr-${idx}`} id={`color-tnr-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.fill} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                <YAxis type="number" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                {confusionSeries.map((s, idx) => (
                  <Area key={idx} name={s.name} data={s.data} dataKey="tnr" fill={`url(#color-tnr-${idx})`} stroke={s.fill} strokeWidth={2} type="monotone" />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => handleCopyChart(tnrChartRef, 'tnr')} className="font-normal text-[#9EA4B0] h-8" disabled={isCopying['tnr']} data-html2canvas-ignore="true">
              {copySuccess['tnr'] ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> <span>Copy Chart</span></>}
            </Button>
          </div>
        </div>

        {/* False Positive Rate to Threshold */}
        <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={fprChartRef}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                <div className="p-2 bg-blue-500/20 rounded-lg flex items-center justify-center h-9 w-9 shrink-0">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <span className="inline-block align-middle pt-0.5 min-w-fit">False Positive Rate to Threshold</span>
              </h3>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                <defs>
                  {confusionSeries.map((s, idx) => (
                    <linearGradient key={`color-fpr-${idx}`} id={`color-fpr-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.fill} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                <YAxis type="number" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                {confusionSeries.map((s, idx) => (
                  <Area key={idx} name={s.name} data={s.data} dataKey="fpr" fill={`url(#color-fpr-${idx})`} stroke={s.fill} strokeWidth={2} type="monotone" />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => handleCopyChart(fprChartRef, 'fpr')} className="font-normal text-[#9EA4B0] h-8" disabled={isCopying['fpr']} data-html2canvas-ignore="true">
              {copySuccess['fpr'] ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> <span>Copy Chart</span></>}
            </Button>
          </div>
        </div>

        {/* False Negative Rate to Threshold */}
        <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm md:col-span-2" ref={fnrChartRef}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                <div className="p-2 bg-blue-500/20 rounded-lg flex items-center justify-center h-9 w-9 shrink-0">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <span className="inline-block align-middle pt-0.5 min-w-fit">False Negative Rate to Threshold</span>
              </h3>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                <defs>
                  {confusionSeries.map((s, idx) => (
                    <linearGradient key={`color-fnr-${idx}`} id={`color-fnr-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.fill} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                <YAxis type="number" domain={[0, 1]} tickCount={11} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                {confusionSeries.map((s, idx) => (
                  <Area key={idx} name={s.name} data={s.data} dataKey="fnr" fill={`url(#color-fnr-${idx})`} stroke={s.fill} strokeWidth={2} type="monotone" />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => handleCopyChart(fnrChartRef, 'fnr')} className="font-normal text-[#9EA4B0] h-8" disabled={isCopying['fnr']} data-html2canvas-ignore="true">
              {copySuccess['fnr'] ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> <span>Copy Chart</span></>}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ModelMetrics;

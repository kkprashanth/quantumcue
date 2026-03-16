/**
 * Reusable Rate vs Threshold chart component using Recharts.
 * Supports TPR, TNR, FPR, and FNR.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Target, Copy, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/Button';
import { loadTPRFPRData, loadTNRFNRData } from '@/utils/mockChartData';

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#3b82f6'];

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

export type RateType = 'TPR' | 'FPR' | 'TNR' | 'FNR';

interface RateThresholdChartProps {
    type: RateType;
    title?: string;
}

export function RateThresholdChart({ type, title }: RateThresholdChartProps) {
    const [data, setData] = useState<{ x: number; y: number }[]>([]);
    const [loading, setLoading] = useState(true);

    const chartRef = useRef<HTMLDivElement>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                if (type === 'TPR' || type === 'FPR') {
                    const result = await loadTPRFPRData();
                    const chartData = result.threshold.map((threshold, i) => ({
                        x: threshold,
                        y: type === 'TPR' ? result.tpr[i] : result.fpr[i],
                    }));
                    setData(chartData);
                } else {
                    const result = await loadTNRFNRData();
                    const chartData = result.threshold.map((threshold, i) => ({
                        x: threshold,
                        y: type === 'TNR' ? result.tnr[i] : result.fnr[i],
                    }));
                    setData(chartData);
                }
            } catch (err) {
                console.error(`Error loading ${type} data:`, err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [type]);

    const handleCopyChart = async () => {
        if (!chartRef.current) return;
        setIsCopying(true);
        try {
            const canvas = await html2canvas(chartRef.current, {
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
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                } catch (err) { }
            });
        } catch (err) {
        } finally {
            setIsCopying(false);
        }
    };

    const chartTitle = title || (() => {
        switch (type) {
            case 'TPR': return 'True Positive Rate to Threshold';
            case 'FPR': return 'False Positive Rate to Threshold';
            case 'TNR': return 'True Negative Rate to Threshold';
            case 'FNR': return 'False Negative Rate to Threshold';
            default: return '';
        }
    })();

    if (loading) {
        return (
            <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm flex items-center justify-center h-[460px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm flex items-center justify-center h-[460px]">
                <p className="text-slate-400 text-sm">No data available</p>
            </div>
        );
    }

    // Get color based on type
    const strokeColor = (() => {
        switch (type) {
            case 'TPR': return CHART_COLORS[0];
            case 'FPR': return CHART_COLORS[1] || '#06b6d4';
            case 'TNR': return CHART_COLORS[2] || '#10b981';
            case 'FNR': return CHART_COLORS[3] || '#f59e0b';
            default: return CHART_COLORS[0];
        }
    })();

    return (
        <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm flex flex-col h-full" ref={chartRef}>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 pb-2 border-b border-blue-800/30">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                        <div className="p-2 bg-blue-500/20 rounded-lg flex items-center justify-center h-9 w-9 shrink-0">
                            <Target className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="inline-block align-middle pt-0.5 min-w-fit">{chartTitle}</span>
                    </h3>
                </div>
            </div>
            <div className="flex-1 min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart margin={{ top: 20, right: 20, bottom: 50, left: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis type="number" dataKey="x" name="Threshold" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} label={{ value: 'Threshold', position: 'insideBottom', offset: -24, fill: '#94a3b8', fontSize: 16, fontWeight: 'bold' }} />
                        <YAxis type="number" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val === 0 ? '' : val} axisLine={false} tickLine={false} label={{ value: 'Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 16, style: { textAnchor: 'middle' }, offset: 5, fontWeight: 'bold' }} />
                        <RechartsTooltip content={<DarkTooltip xLabel="Threshold" />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                        <Area name={type} data={data} dataKey="y" fill="transparent" stroke={strokeColor} strokeWidth={2} type="monotone" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-end">
                <Button size="sm" variant="ghost" onClick={handleCopyChart} className="hover:bg-blue-800/50 font-normal text-[#9EA4B0] h-8" disabled={isCopying} data-html2canvas-ignore="true">
                    {copySuccess ? <><Check className="w-4 h-4 mr-2 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> <span>Copy Chart</span></>}
                </Button>
            </div>
        </div>
    );
}

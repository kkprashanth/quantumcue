import { useState, useEffect, useRef } from 'react';
import { Activity, Shield, MapPin, Monitor, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, TrendingUp, Search, ArrowUpDown, ArrowUp, ArrowDown, Trash2, X, Calendar, Copy, Check, Clock, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as loginActivityApi from '../../api/endpoints/loginActivity';
import { Button } from '../../components/ui/Button';
import html2canvas from 'html2canvas';


export const LoginActivity = () => {
    const [logins, setLogins] = useState<loginActivityApi.LoginHistoryEntry[]>([]);
    const [summary, setSummary] = useState<loginActivityApi.LoginHistorySummary | null>(null);
    const [stats, setStats] = useState<loginActivityApi.DailyLoginStats[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [size] = useState(5);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchEmail, setSearchEmail] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showPruneModal, setShowPruneModal] = useState(false);
    const [pruneDate, setPruneDate] = useState('');
    const [isPruning, setIsPruning] = useState(false);
    const [statsPeriod, setStatsPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('30d');

    const buildBaselineStats = (stats: any[]) =>
        stats.map(d => ({
            ...d,
            success: 0,
            failure: 0,
        }));


    // Debounce search
    const [debouncedSearchEmail, setDebouncedSearchEmail] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchEmail(searchEmail);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchEmail]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [data, summaryData, statsData] = await Promise.all([
                loginActivityApi.listLoginActivity(page, size, undefined, debouncedSearchEmail, filterDate || undefined, sortBy, sortOrder),
                loginActivityApi.getLoginActivitySummary(),
                loginActivityApi.getLoginActivityStats(statsPeriod)
            ]);
            setLogins(data.items);
            setTotal(data.total);
            setSummary(summaryData);
            const realStats = statsData.daily_stats;

            setStats(buildBaselineStats(realStats));
            requestAnimationFrame(() => {
                setStats(realStats);
            });

        } catch (err) {
            console.error('Failed to fetch login activity:', err);
            setError('Failed to load login activity. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, size, debouncedSearchEmail, filterDate, sortBy, sortOrder, statsPeriod]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc'); // Default to newest first when switching fields
        }
        setPage(1);
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <ArrowUpDown size={14} className="text-gray-400 ml-1" />;
        return sortOrder === 'asc'
            ? <ArrowUp size={14} className="text-blue-600 ml-1" />
            : <ArrowDown size={14} className="text-blue-600 ml-1" />;
    };

    const handlePrune = async () => {
        if (!pruneDate) return;

        setIsPruning(true);
        try {
            const result = await loginActivityApi.pruneLoginActivity(new Date(pruneDate).toISOString());
            setShowPruneModal(false);
            setPruneDate('');
            fetchData();
            // Optional success toast could go here
        } catch (err) {
            console.error('Failed to prune logs:', err);
            // Optional error handling
        } finally {
            setIsPruning(false);
        }
    };

    const totalPages = Math.ceil(total / size);

    const chartRef = useRef<HTMLDivElement>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

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
                if (!blob) {
                    console.error('Canvas is empty');
                    return;
                }

                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                } catch (err) {
                    console.error('Failed to copy to clipboard:', err);
                }
            });
        } catch (err) {
            console.error('Failed to generate image:', err);
        } finally {
            setIsCopying(false);
        }
    };

    const chartData = summary ? [
        { name: 'Success', value: summary.success, color: '#10b981' },
        { name: 'Failure', value: summary.failure, color: '#ef4444' },
    ] : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Activity</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPruneModal(true)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Logs
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchData}
                        disabled={isLoading}
                        className="bg-white border border-gray-200"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>



            <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={chartRef}>
                {/* <div className="bg-[#172554] border border-blue-900/30 rounded-xl p-6 shadow-sm" ref={chartRef}> */}
                <div className="flex flex-row items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 leading-none">
                            <div className="p-2 bg-blue-500/10 rounded-lg flex items-center justify-center h-9 w-9 shrink-0">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="inline-block align-middle pt-0.5">Authentication Monitoring</span>
                        </h3>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-400 font-medium">
                        <div className="flex items-center gap-2 leading-none h-4">
                            <span className="w-3 h-3 inline-block align-middle bg-emerald-500 shadow-sm shrink-0"></span>
                            <span className="inline-block align-middle pt-0.5">Success</span>
                        </div>
                        <div className="flex items-center gap-2 leading-none h-4">
                            <span className="w-3 h-3 inline-block align-middle bg-red-500 shadow-sm shrink-0"></span>
                            <span className="inline-block align-middle pt-0.5">Failure</span>
                        </div>
                    </div>
                </div>
                <div className="h-64 relative right-2">
                    <ResponsiveContainer width="100%" height="105%">
                        <AreaChart
                            key={stats.length}
                            data={stats}
                            margin={{
                                top: 10,
                                right: 30,
                                left: 30,
                                bottom: 50,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorFailure" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: '#94a3b8', fontSize: 12, dy: 8 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickLine={false}
                                minTickGap={30}
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    if (statsPeriod === '30d' || statsPeriod === '7d') {
                                        return `${date.getMonth() + 1}/${date.getDate()}`;
                                    }
                                    const hours = date.getHours();
                                    const minutes = date.getMinutes();
                                    const ampm = hours >= 12 ? 'pm' : 'am';
                                    const formattedHour = hours % 12 || 12;
                                    const formattedMinutes = minutes.toString().padStart(2, '0');
                                    return `${formattedHour}:${formattedMinutes}${ampm}`;
                                }}
                                label={{
                                    value: (statsPeriod === '30d' || statsPeriod === '7d') ? 'Date' : 'Time',
                                    position: 'insideBottom',
                                    offset: -24,
                                    fill: '#94a3b8',
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                }}
                            />
                            <YAxis
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                                tickFormatter={(value) => Math.floor(value).toString()}
                                label={{
                                    value: 'Logins',
                                    angle: -90,
                                    position: 'insideLeft',
                                    fill: '#94a3b8',
                                    fontSize: 16,
                                    style: { textAnchor: 'middle' },
                                    offset: 5,
                                    fontWeight: 'bold',
                                }}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-xl">
                                                <p className="font-semibold text-white mb-2">
                                                    {new Date(label).toLocaleString([], {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: (statsPeriod === '30d' || statsPeriod === '7d') ? undefined : '2-digit',
                                                        minute: (statsPeriod === '30d' || statsPeriod === '7d') ? undefined : '2-digit'
                                                    })}
                                                </p>
                                                {payload.map((entry: any) => (
                                                    <p key={entry.name} className="text-sm flex items-center justify-between gap-4" style={{ color: entry.color }}>
                                                        <span className="capitalize">{entry.name}:</span>
                                                        <span className="font-mono font-bold">{entry.value}</span>
                                                    </p>
                                                ))}
                                                <div className="mt-2 pt-2 border-t border-slate-700">
                                                    <p className="text-xs text-slate-400">
                                                        Total: <span className="text-white font-bold">{payload.reduce((acc: number, curr: any) => acc + curr.value, 0)}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />

                            <Area
                                type="monotone"
                                dataKey="success"
                                name="Success"
                                stroke="#10b981"
                                fill="url(#colorSuccess)"
                                strokeWidth={2}
                            />

                            <Area
                                type="monotone"
                                dataKey="failure"
                                name="Failure"
                                stroke="#ef4444"
                                fill="url(#colorFailure)"
                                strokeWidth={2}
                            />

                        </AreaChart>
                    </ResponsiveContainer>
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#172554]/40">
                            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                        </div>
                    )}
                    {!isLoading && stats.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-blue-300 italic">
                            No data available
                        </div>
                    )}
                </div>
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative">
                        <select
                            value={statsPeriod}
                            onChange={(e) => setStatsPeriod(e.target.value as any)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-[#9EA4B0]"
                            data-html2canvas-ignore="true"
                        >
                            <option value="1h">Last Hour</option>
                            <option value="24h">Last Day</option>
                            <option value="7d">Last Week</option>
                            <option value="30d">Last Month</option>
                        </select>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-[#9EA4B0] hover:bg-blue-800/50 font-normal pointer-events-none"
                            data-html2canvas-ignore="true"
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            {{
                                '1h': 'Last Hour',
                                '24h': 'Last Day',
                                '7d': 'Last Week',
                                '30d': 'Last Month'
                            }[statsPeriod]}
                            <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                        </Button>
                    </div>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyChart}
                        className="hover:bg-blue-800/50 font-normal text-[#9EA4B0]"
                        disabled={isCopying}
                        data-html2canvas-ignore="true"
                    >
                        {copySuccess ? (
                            <>
                                <Check className="w-4 h-4 mr-2 text-green-400" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy color='gray' className="w-4 h-4 mr-2" />
                                <span className="text-gray-400">Copy Chart</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => {
                            setFilterDate(e.target.value);
                            setPage(1);
                        }}
                        className="pl-10 pr-4 py-2 text-sm border uppercase border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">Authentication Logs</h3>
                    <div className="text-sm text-gray-500 font-medium">
                        Showing {logins.length} of {total} events
                    </div>
                </div>

                {error ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle size={24} />
                        </div>
                        <p className="text-gray-900 font-semibold mb-2">{error}</p>
                        <Button variant="ghost" onClick={fetchData} className="text-blue-600">Try Again</Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th
                                        className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors w-1/3 text-left"
                                        onClick={() => handleSort('email')}
                                    >
                                        <div className="flex items-center">
                                            User Email
                                            <SortIcon field="email" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 pr-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors w-1/3 text-center"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center justify-center">
                                            Status
                                            <SortIcon field="status" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors w-1/3 text-right"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center justify-end">
                                            Timestamp
                                            <SortIcon field="created_at" />
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    Array.from({ length: size }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4 text-left"><div className="h-4 bg-gray-100 rounded w-3/4"></div></td>
                                            <td className="px-6 py-4 text-center"><div className="h-4 bg-gray-100 rounded w-1/2 mx-auto"></div></td>
                                            <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-100 rounded w-1/2 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : logins.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500 italic">
                                            No authentication entries found.
                                        </td>
                                    </tr>
                                ) : (
                                    logins.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-left w-1/3">
                                                <div className="text-sm font-semibold text-gray-900">{entry.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center w-1/3">
                                                <span className={`inline-flex items-center gap-1.5 py-1 rounded-full text-xs font-medium border ${entry.status === 'success'
                                                    ? 'bg-white text-emerald-700 border-white'
                                                    : 'bg-white text-red-700 border-white'
                                                    }`}>
                                                    {/* <span className={`w-1.5 h-1.5 rounded-full ${entry.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></span> */}
                                                    {entry.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 text-right w-1/3">
                                                {new Date(entry.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Page {page} of {totalPages || 1}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={page === 1 || isLoading}
                            onClick={() => setPage(page - 1)}
                            className="bg-white border border-gray-200"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={page === totalPages || totalPages === 0 || isLoading}
                            onClick={() => setPage(page + 1)}
                            className="bg-white border border-gray-200"
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            </div>
            {/* Prune Modal */}
            {
                showPruneModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <span className="p-2 bg-red-50 rounded-lg text-red-500">
                                        <Trash2 size={20} />
                                    </span>
                                    Prune Logs
                                </h3>
                                <button
                                    onClick={() => setShowPruneModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                    <div className="flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="text-sm text-amber-800">
                                            <p className="font-medium mb-1">Warning: Irreversible Action</p>
                                            You are about to permanently delete login activity logs. This action cannot be undone.
                                        </div>
                                    </div>
                                </div>

                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Delete logs older than
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="date"
                                        value={pruneDate}
                                        onChange={(e) => setPruneDate(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 justify-end">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowPruneModal(false)}
                                    disabled={isPruning}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handlePrune}
                                    disabled={!pruneDate || isPruning}
                                    className="bg-red-600 hover:bg-red-700 text-white border-transparent"
                                >
                                    {isPruning ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Pruning...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Logs
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

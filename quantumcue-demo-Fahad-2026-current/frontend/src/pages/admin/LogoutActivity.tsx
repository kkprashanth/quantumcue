import { useState, useEffect } from 'react';
import { Activity, Clock, LogOut, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, TrendingUp, Search, ArrowUpDown, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as logoutActivityApi from '../../api/endpoints/logoutActivity';
import { Button } from '../../components/ui/Button';

export const LogoutActivity = () => {
    const [logins, setLogins] = useState<any[]>([]);
    const [stats, setStats] = useState<logoutActivityApi.LogoutStats | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchEmail, setSearchEmail] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');

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
            const [data, statsData] = await Promise.all([
                logoutActivityApi.listLogoutActivity(page, size, undefined, debouncedSearchEmail, filterDate || undefined, sortBy, sortOrder),
                logoutActivityApi.getLogoutActivityStats(30)
            ]);
            setLogins(data.items);
            setTotal(data.total);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to fetch logout activity:', err);
            setError('Failed to load logout activity. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, size, debouncedSearchEmail, filterDate, sortBy, sortOrder]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setPage(1);
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <ArrowUpDown size={14} className="text-gray-400 ml-1" />;
        return sortOrder === 'asc'
            ? <ArrowUp size={14} className="text-blue-600 ml-1" />
            : <ArrowDown size={14} className="text-blue-600 ml-1" />;
    };

    const totalPages = Math.ceil(total / size);

    const formatDuration = (start: string, end: string | null) => {
        if (!end) return '-';
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const diffMs = endTime - startTime;

        const seconds = Math.floor((diffMs / 1000) % 60);
        const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
        const hours = Math.floor((diffMs / (1000 * 60 * 60)));

        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    const formatSeconds = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Logout Activity</h1>
                    <p className="text-gray-500">Monitor session duration and user activity</p>
                </div>
                <div className="flex items-center gap-3">
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Last 30 Days</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {stats ? formatSeconds(stats.average_duration_seconds) : '-'}
                    </h3>
                    <p className="text-sm text-gray-500">Average Session Duration</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <Activity className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Current</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {stats ? stats.active_sessions : '-'}
                    </h3>
                    <p className="text-sm text-gray-500">Active Sessions</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <LogOut className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Total</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {stats ? stats.total_sessions : '-'}
                    </h3>
                    <p className="text-sm text-gray-500">Total Sessions Recorded</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                        className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Session Logs</h3>
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
                                <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('email')}>
                                        <div className="flex items-center">User Email <SortIcon field="email" /></div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('created_at')}>
                                        <div className="flex items-center">Login Time <SortIcon field="created_at" /></div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('logout_at')}>
                                        <div className="flex items-center">Logout Time <SortIcon field="logout_at" /></div>
                                    </th>
                                    <th className="px-6 py-4">
                                        <div className="flex items-center">Duration</div>
                                    </th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    Array.from({ length: size }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-3/4"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-1/2"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-1/2"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-1/4"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-1/4"></div></td>
                                        </tr>
                                    ))
                                ) : logins.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                            No session logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    logins.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-900">{entry.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(entry.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {entry.logout_at ? new Date(entry.logout_at).toLocaleString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm  font-mono text-gray-600">
                                                {formatDuration(entry.created_at, entry.logout_at || (new Date(entry.last_activity_at).getTime() > new Date(entry.created_at).getTime() ? entry.last_activity_at : null))}
                                            </td>
                                            <td className="px-6 py-4">
                                                {entry.logout_at ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                        Closed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        Active
                                                    </span>
                                                )}
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
        </div>
    );
};

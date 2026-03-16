import { useState, useMemo } from 'react';
import { Activity, AlertCircle, Database, Brain, Briefcase } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { Tooltip } from '@/components/ui/Tooltip';
import { useModels } from '@/hooks/useModels';
import { useDatasets } from '@/hooks/useDatasets';
import { useJobs } from '@/hooks/useJobs';

type ActivityItem = {
    id: string;
    name: string;
    type: 'Model' | 'Dataset' | 'Job';
    status: string;
    created_at: string;
};

export const FullActivity = () => {
    const { data: modelsData, isLoading: modelsLoading, error: modelsError } = useModels({ page_size: 50 });
    const { data: datasetsData, isLoading: datasetsLoading, error: datasetsError } = useDatasets({ page_size: 50 });
    const { data: jobsData, isLoading: jobsLoading, error: jobsError } = useJobs({ page_size: 50 });

    const isLoading = modelsLoading || datasetsLoading || jobsLoading;
    const hasError = modelsError || datasetsError || jobsError;

    // Combine and sort activities
    const { activities, stats } = useMemo(() => {
        let allActivities: ActivityItem[] = [];
        let modelCount = 0;
        let datasetCount = 0;
        let jobCount = 0;

        if (modelsData?.models) {
            modelCount = modelsData.total || modelsData.models.length;
            allActivities = allActivities.concat(
                modelsData.models.map(m => ({
                    id: m.id,
                    name: m.name,
                    type: 'Model',
                    status: m.status,
                    created_at: m.created_at
                }))
            );
        }

        if (datasetsData?.datasets) {
            datasetCount = datasetsData.total || datasetsData.datasets.length;
            allActivities = allActivities.concat(
                datasetsData.datasets.map(d => ({
                    id: d.id,
                    name: d.name,
                    type: 'Dataset',
                    status: d.status,
                    created_at: d.created_at
                }))
            );
        }

        if (jobsData?.jobs) {
            jobCount = jobsData.total || jobsData.jobs.length;
            allActivities = allActivities.concat(
                jobsData.jobs.map(j => ({
                    id: j.id,
                    name: j.name,
                    type: 'Job',
                    status: j.status,
                    created_at: j.created_at
                }))
            );
        }

        // Sort descending by created_at
        allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return {
            activities: allActivities,
            stats: {
                total: modelCount + datasetCount + jobCount,
                models: modelCount,
                datasets: datasetCount,
                jobs: jobCount
            }
        };
    }, [modelsData, datasetsData, jobsData]);

    const getStatusBadgeColor = (itemType: string, status: string) => {
        switch (itemType) {
            case 'Model':
                switch (status) {
                    case 'ready': return 'bg-success-50 text-success-700 border-success-200';
                    case 'hosted_active': return 'bg-blue-50 text-blue-700 border-blue-200';
                    case 'training': return 'bg-warning-50 text-warning-700 border-warning-200';
                    case 'archived': return 'bg-grey-100 text-grey-600 border-grey-200';
                    case 'error': return 'bg-error-50 text-error-700 border-error-200';
                    default: return 'bg-grey-100 text-grey-600 border-grey-200';
                }
            case 'Dataset':
                switch (status) {
                    case 'ready': return 'bg-success-50 text-success-700 border-success-200';
                    case 'processing': return 'bg-warning-50 text-warning-700 border-warning-200';
                    case 'uploading': return 'bg-blue-50 text-blue-700 border-blue-200';
                    case 'error': return 'bg-error-50 text-error-700 border-error-200';
                    default: return 'bg-grey-100 text-grey-600 border-grey-200';
                }
            case 'Job':
                switch (status) {
                    case 'completed': return 'bg-success-50 text-success-700 border-success-200';
                    case 'failed': return 'bg-error-50 text-error-700 border-error-200';
                    case 'running': return 'bg-warning-50 text-warning-700 border-warning-200';
                    case 'queued': return 'bg-navy-50 text-navy-700 border-navy-200';
                    case 'pending': return 'bg-blue-50 text-blue-700 border-blue-200';
                    case 'draft': return 'bg-grey-100 text-grey-600 border-grey-200';
                    default: return 'bg-grey-100 text-grey-600 border-grey-200';
                }
            default:
                return 'bg-grey-100 text-grey-600 border-grey-200';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Model': return <Brain className="w-4 h-4 text-cyan-500" />;
            case 'Dataset': return <Database className="w-4 h-4 text-blue-500" />;
            case 'Job': return <Briefcase className="w-4 h-4 text-warning-500" />;
            default: return null;
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }).format(date);
    };

    const statsBarData = [
        { label: 'Models', value: stats.models, color: 'bg-cyan-500' },
        { label: 'Datasets', value: stats.datasets, color: 'bg-blue-500' },
        { label: 'Jobs', value: stats.jobs, color: 'bg-warning-500' },
    ].filter(s => s.value > 0);

    return (
        <PageContainer title="Full Activity">

            {stats.total > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-secondary">Activity Distribution</span>
                        <span className="text-sm font-bold text-text-primary">{stats.total} Total Events</span>
                    </div>
                    <div className="w-full h-5 flex rounded-full bg-grey-100 dark:bg-surface-elevated">
                        {statsBarData.map((stat, index) => {
                            const percentage = stats.total > 0 ? ((stat.value / stats.total) * 100).toFixed(1) : 0;
                            const isFirst = index === 0;
                            const isLast = index === statsBarData.length - 1;
                            const roundedClasses = `${isFirst ? 'rounded-l-full' : ''} ${isLast ? 'rounded-r-full' : ''}`.trim();

                            return (
                                <Tooltip
                                    key={stat.label}
                                    content={`${stat.label}: ${stat.value} (${percentage}%)`}
                                    className="h-full block flex-shrink-0"
                                    style={{ width: `${(stat.value / stats.total) * 100}%` }}
                                >
                                    <div
                                        className={`h-full w-full ${stat.color} ${roundedClasses} transition-all hover:opacity-80`}
                                    />
                                </Tooltip>
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
                        {statsBarData.map((stat) => (
                            <div key={stat.label} className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-none ${stat.color}`} />
                                <span className="text-xs text-text-secondary">
                                    <span className="font-semibold text-text-primary">{stat.value}</span> {stat.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Content */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            )}

            {hasError && !isLoading && (
                <Card className="p-6 border-error/20 bg-error/10 mb-4">
                    <div className="flex items-center gap-2 text-error">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-semibold">Failed to load some activity data. Please try again.</span>
                    </div>
                </Card>
            )}

            {!isLoading && activities.length === 0 && !hasError && (
                <Card className="p-12 text-center">
                    <Activity className="w-12 h-12 text-grey-400 dark:text-text-tertiary mx-auto mb-4" />
                    <p className="text-grey-900 dark:text-text-primary font-semibold mb-2">No activity found</p>
                    <p className="text-grey-500 dark:text-text-tertiary text-sm">
                        Activity from models, datasets, and jobs will appear here
                    </p>
                </Card>
            )}

            {!isLoading && activities.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-sm uppercase text-text-primary font-semibold tracking-wider">
                                    <th className="px-6 py-4 w-[40%]">Name</th>
                                    <th className="px-6 py-4 w-[20%]">Type</th>
                                    <th className="px-6 py-4 w-[20%]">Status</th>
                                    <th className="px-6 py-4 w-[20%]">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activities.map((activity) => (
                                    <tr key={`${activity.type}-${activity.id}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-text-primary truncate">
                                                {activity.name}
                                            </div>
                                            <div className="text-xs text-text-tertiary mt-0.5 font-mono truncate">
                                                {activity.id}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(activity.type)}
                                                <span className="text-sm font-medium text-text-secondary">{activity.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(activity.type, activity.status)}`}>
                                                {formatStatus(activity.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-secondary">
                                            {formatDate(activity.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </PageContainer>
    );
};

export default FullActivity;

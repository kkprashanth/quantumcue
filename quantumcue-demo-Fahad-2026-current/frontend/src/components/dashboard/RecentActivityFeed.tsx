/**
 * Recent activity feed component showing mixed timeline with new design system.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Brain, Database, Zap, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { RecentActivity } from '@/api/endpoints/dashboard';

interface RecentActivityFeedProps {
  activities: RecentActivity[];
  className?: string;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  className = '',
}) => {
  const navigate = useNavigate();

  const recentActivities = useMemo(() => {
    // Sort by created_at descending and take top 5
    return [...activities]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [activities]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'job':
        return <Briefcase className="w-4 h-4" />;
      case 'model':
        return <Brain className="w-4 h-4" />;
      case 'dataset':
        return <Database className="w-4 h-4" />;
      case 'interaction':
        return <Zap className="w-4 h-4" />;
      default:
        return <Briefcase className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'job':
        return 'text-navy-700';
      case 'model':
        return 'text-cyan-500';
      case 'dataset':
        return 'text-success-500';
      case 'interaction':
        return 'text-warning-500';
      default:
        return 'text-grey-500 dark:text-text-tertiary';
    }
  };

  const getStatusVariant = (status: string | null): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    if (!status) return 'default';
    switch (status) {
      case 'completed':
      case 'ready':
        return 'success';
      case 'running':
      case 'queued':
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      case 'hosted_active':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return null;
    const labels: Record<string, string> = {
      pending: 'Pending',
      queued: 'Queued',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed',
      ready: 'Ready',
      hosted_active: 'Active',
      archived: 'Archived',
      processing: 'Processing',
    };
    return labels[status] || status;
  };

  const handleActivityClick = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'job':
        navigate(`/jobs/${activity.id}`);
        break;
      case 'model':
        navigate(`/models/${activity.id}`);
        break;
      case 'dataset':
        navigate(`/datasets/${activity.id}`);
        break;
      case 'interaction':
        if (activity.metadata?.model_id) {
          navigate(`/models/${activity.metadata.model_id}`);
        }
        break;
    }
  };



  return (
    <Card className={`p-6 pl-8 h-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-grey-900 dark:text-text-primary">Activity</h3>
        <button
          onClick={() => navigate('/activity')}
          className="flex items-center gap-1 text-sm text-navy-700 hover:text-navy-800 dark:text-navy-600 transition-colors font-medium"
        >
          View all
          <ExternalLink size={14} />
        </button>
      </div>

      {recentActivities.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={`${activity.type}-${activity.id}`}
                onClick={() => handleActivityClick(activity)}
                className="flex items-start gap-3 py-3 pr-3 rounded-lg hover:bg-grey-50 dark:hover:bg-surface-elevated transition-colors cursor-pointer group"
              >
                <div
                  className={`p-2 rounded-lg bg-grey-100 dark:bg-surface-elevated ${getActivityColor(
                    activity.type
                  )} group-hover:bg-grey-200 dark:group-hover:bg-surface transition-colors`}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-grey-900 dark:text-text-primary truncate">
                      {activity.title}
                    </p>
                    {activity.status && (
                      <Badge variant={getStatusVariant(activity.status)} className='min-w-24 justify-center'>
                        {getStatusLabel(activity.status)}
                      </Badge>
                    )}
                  </div>
                  {activity.description && (
                    <p className="text-xs text-grey-500 dark:text-text-tertiary line-clamp-1">
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Briefcase size={32} className="mx-auto text-grey-400 dark:text-text-tertiary mb-2" />
          <p className="text-grey-600 dark:text-text-secondary">No recent activity</p>
          <button
            onClick={() => navigate('/jobs/new')}
            className="mt-4 text-sm text-navy-700 hover:text-navy-800 dark:text-navy-600 transition-colors font-medium"
          >
            Create your first job
          </button>
        </div>
      )}
    </Card>
  );
};

export default RecentActivityFeed;

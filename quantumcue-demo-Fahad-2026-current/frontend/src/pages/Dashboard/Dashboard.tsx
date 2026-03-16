/**
 * Dashboard page component with new design system.
 */

import React from 'react';
import { XCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { ProviderGrid } from '../../components/dashboard/ProviderGrid';
import { RecentJobsTable } from '../../components/dashboard/RecentJobsTable';
import { RecentActivityFeed } from '../../components/dashboard/RecentActivityFeed';
import { ModelsOverview } from '../../components/dashboard/ModelsOverview';
// Keep imports for future use
// import { ModelsOverviewCard } from '../../components/dashboard/ModelsOverviewCard';
import { TimeRemainingCard } from '../../components/dashboard/TimeRemainingCard';
// import { DatasetsOverviewCard } from '../../components/dashboard/DatasetsOverviewCard';
// Keep imports for future use
// import { MetricsOverviewCard } from '../../components/dashboard/MetricsOverviewCard';
import { SummaryCard } from '../../components/dashboard/SummaryCard';
import { ModelPerformanceCard } from '../../components/dashboard/ModelPerformanceCard';
import { RecentActivityCard } from '../../components/dashboard/RecentActivityCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../hooks/useAuth';
import { isNewUser } from '../../utils/user';

export const Dashboard: React.FC = () => {
  const { data, isLoading, error } = useDashboard();
  const { user } = useAuth();
  const navigate = useNavigate();
  const userIsNew = isNewUser(user);

  if (isLoading) {
    return (
      <PageContainer
        title="Dashboard"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-surface border border-grey-200 dark:border-border rounded-xl p-6 animate-pulse"
            >
              <div className="h-4 bg-grey-200 dark:bg-grey-800 rounded w-1/2 mb-4" />
              <div className="h-8 bg-grey-200 dark:bg-grey-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer
        title="Dashboard"
      >
        <div className="bg-error/10 border border-error/20 rounded-xl p-6 text-center">
          <XCircle className="mx-auto text-error mb-2" size={32} />
          <p className="text-error">Failed to load dashboard data</p>
          <p className="text-grey-500 dark:text-text-tertiary text-sm mt-1">{error.message}</p>
        </div>
      </PageContainer>
    );
  }

  const {
    model_stats,
    recent_jobs,
    recent_models,
    recent_activity,
    metrics_stats,
  } = data!;

  return (
    <div className="relative">
      <PageContainer
        title="Dashboard"
      >

        <Card variant="section" className="p-6 mb-8">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="animate-fade-in h-full" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
              <SummaryCard data={data!} />
            </div>
            <div className="animate-fade-in h-full" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              <RecentActivityCard activities={recent_activity} />
            </div>
            <div className="animate-fade-in h-full" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              <TimeRemainingCard />
            </div>
            <div className="animate-fade-in h-full" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
              <ModelPerformanceCard stats={metrics_stats} isNewUser={userIsNew} />
            </div>
            {/* ModelsOverviewCard, DatasetsOverviewCard, and MetricsOverviewCard removed but code kept for future use */}
            {/* <div className="animate-fade-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
            <ModelsOverviewCard stats={model_stats} />
          </div> */}
            {/* <div className="animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <DatasetsOverviewCard stats={dataset_stats} />
          </div> */}
            {/* <div className="animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <MetricsOverviewCard stats={metrics_stats} />
          </div> */}
          </div>
        </Card>

        <div className="mb-8 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <ProviderGrid />
        </div>

        <Card variant="section" className="p-6 mb-6">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Recent Activity</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="animate-fade-in h-[22rem]" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
              <RecentActivityFeed className="pr-10" activities={recent_activity} />
            </div>
            <div className="animate-fade-in h-[22rem]" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
              <ModelsOverview className="pr-10" stats={model_stats} recentModels={recent_models} />
            </div>
            <div className="animate-fade-in h-[22rem]" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
              <RecentJobsTable className="pr-10" jobs={recent_jobs} />
            </div>
          </div>
        </Card>
      </PageContainer>
    </div>
  );
};

export default Dashboard;

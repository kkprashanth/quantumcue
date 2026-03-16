/**
 * Models list page with new design system.
 */

import { useState } from 'react';
import { Brain, AlertCircle, MoreVertical, Check } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { ModelCard, ModelRow } from '@/components/models';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dropdown } from '@/components/ui/Dropdown';
import { Tooltip } from '@/components/ui/Tooltip';
import { useModels, useModelStatusStats } from '@/hooks/useModels';
import type { ModelStatus } from '@/types';

const PAGE_SIZE = 10;

export const ModelsList = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ModelStatus | undefined>();

  const { data: modelsData, isLoading, error } = useModels({
    status: statusFilter,
    page,
    page_size: PAGE_SIZE,
  });

  // Calculate total_pages as fallback if backend value seems incorrect
  const calculatedTotalPages = modelsData
    ? Math.ceil(modelsData.total / PAGE_SIZE)
    : 1;
  const totalPages = modelsData && modelsData.total_pages > 0
    ? modelsData.total_pages
    : calculatedTotalPages;
  const shouldShowPagination = modelsData && (totalPages > 1 || modelsData.total > PAGE_SIZE);

  const { data: statsData } = useModelStatusStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-success-500';
      case 'hosted_active': return 'bg-blue-500';
      case 'training': return 'bg-warning-500';
      case 'archived': return 'bg-grey-500';
      case 'error': return 'bg-error-500';
      default: return 'bg-grey-200';
    }
  };

  const stats = statsData ? [
    { label: 'Hosted', value: statsData.hosted_active, status: 'hosted_active' },
    { label: 'Ready', value: statsData.ready, status: 'ready' },
    { label: 'Training', value: statsData.training, status: 'training' },
    { label: 'Archived', value: statsData.archived, status: 'archived' },
    { label: 'Error', value: statsData.error, status: 'error' },
  ].filter(s => s.value > 0) : [];

  const totalForBar = stats.reduce((acc, curr) => acc + curr.value, 0);

  const filterItems = [
    {
      label: 'All',
      onClick: () => setStatusFilter(undefined),
      icon: !statusFilter ? <Check size={14} className="text-navy-700" /> : <div className="w-[14px]" />,
    },
    {
      label: 'Ready',
      onClick: () => setStatusFilter('ready'),
      icon: statusFilter === 'ready' ? <Check size={14} className="text-navy-700" /> : <div className="w-[14px]" />,
    },
    {
      label: 'Hosted',
      onClick: () => setStatusFilter('hosted_active'),
      icon: statusFilter === 'hosted_active' ? <Check size={14} className="text-navy-700" /> : <div className="w-[14px]" />,
    },
    {
      label: 'Archived',
      onClick: () => setStatusFilter('archived'),
      icon: statusFilter === 'archived' ? <Check size={14} className="text-navy-700" /> : <div className="w-[14px]" />,
    },
  ];

  return (
    <PageContainer
      title="Models"
      titleSuffix={
        <Dropdown
          trigger={
            <div className="p-1.5 hover:bg-grey-100 dark:hover:bg-surface-elevated rounded-lg transition-colors text-grey-500 dark:text-text-tertiary">
              <MoreVertical size={20} />
            </div>
          }
          items={filterItems}
          align="left"
        />
      }
    >

      {/* Stats Summary Bar */}
      {statsData && totalForBar > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">Model Distribution</span>
            <span className="text-sm font-bold text-text-primary">{statsData.total} Total Models</span>
          </div>
          <div className="w-full h-5 flex rounded-full bg-grey-100 dark:bg-surface-elevated">
            {stats.map((stat, index) => {
              const percentage = totalForBar > 0 ? ((stat.value / totalForBar) * 100).toFixed(1) : 0;
              const isFirst = index === 0;
              const isLast = index === stats.length - 1;
              const roundedClasses = `${isFirst ? 'rounded-l-full' : ''} ${isLast ? 'rounded-r-full' : ''}`.trim();

              return (
                <Tooltip
                  key={stat.status}
                  content={`${stat.label}: ${stat.value} (${percentage}%)`}
                  className="h-full block flex-shrink-0"
                  style={{ width: `${(stat.value / totalForBar) * 100}%` }}
                >
                  <div
                    className={`h-full w-full ${getStatusColor(stat.status)} ${roundedClasses} transition-all hover:opacity-80`}
                  />
                </Tooltip>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
            {stats.map((stat) => (
              <div key={stat.status} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-none ${getStatusColor(stat.status)}`} />
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

      {error && (
        <Card className="p-6 border-error/20 bg-error/10">
          <div className="flex items-center gap-2 text-error">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Failed to load models. Please try again.</span>
          </div>
        </Card>
      )}

      {modelsData && (
        <>
          {modelsData.models.length === 0 ? (
            <Card className="p-12 text-center">
              <Brain className="w-12 h-12 text-grey-400 dark:text-text-tertiary mx-auto mb-4" />
              <p className="text-grey-900 dark:text-text-primary font-semibold mb-2">No models found</p>
              <p className="text-grey-500 dark:text-text-tertiary text-sm">
                Train your first model to get started
              </p>
            </Card>
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-sm uppercase text-text-primary font-semibold tracking-wider">
                        <th className="px-6 py-4 w-[25%]">Name</th>
                        <th className="px-6 py-4 w-[12%]">Status</th>
                        <th className="px-6 py-4 w-[15%]">Type</th>
                        <th className="px-6 py-4 w-[10%]">Predictions</th>
                        <th className="px-6 py-4 w-[13%]">Avg. Confidence</th>
                        <th className="px-6 py-4 w-[10%]">Details</th>
                        <th className="px-6 py-4 w-[10%]">Last Updated</th>
                        <th className="px-6 py-4 w-[5%] text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {modelsData.models.map((model) => (
                        <ModelRow key={model.id} model={model} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {shouldShowPagination && (
                <div className="mt-6">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}

              {/* Results info */}
              {modelsData.total > 0 && (
                <p className="text-center text-grey-500 dark:text-text-tertiary text-sm mt-4">
                  Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
                  {Math.min(page * PAGE_SIZE, modelsData.total)} of {modelsData.total} models
                </p>
              )}
            </>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default ModelsList;

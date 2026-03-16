import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, AlertCircle, MoreVertical, Check } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { DatasetRow } from '@/components/datasets';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dropdown } from '@/components/ui/Dropdown';
import { Tooltip } from '@/components/ui/Tooltip';
import { useDatasets, useDatasetStats } from '@/hooks/useDatasets';
import type { DatasetStatus } from '@/types';

const PAGE_SIZE = 10;

export const DatasetsList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<DatasetStatus | undefined>();

  const { data: datasetsData, isLoading, error } = useDatasets({
    status: statusFilter,
    page,
    page_size: PAGE_SIZE,
  });

  const calculatedTotalPages = datasetsData
    ? Math.ceil(datasetsData.total / PAGE_SIZE)
    : 1;
  const totalPages = datasetsData && datasetsData.total_pages > 0
    ? datasetsData.total_pages
    : calculatedTotalPages;
  const shouldShowPagination = datasetsData && (totalPages > 1 || datasetsData.total > PAGE_SIZE);

  const { data: statsData } = useDatasetStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-success-500';
      case 'processing': return 'bg-warning-500';
      case 'uploading': return 'bg-blue-500';
      case 'error': return 'bg-error-500';
      default: return 'bg-grey-200';
    }
  };

  const stats = statsData ? [
    { label: 'Ready', value: statsData.ready, status: 'ready' },
    { label: 'Processing', value: statsData.processing, status: 'processing' },
    { label: 'Uploading', value: statsData.uploading, status: 'uploading' },
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
      label: 'Processing',
      onClick: () => setStatusFilter('processing'),
      icon: statusFilter === 'processing' ? <Check size={14} className="text-navy-700" /> : <div className="w-[14px]" />,
    },
    {
      label: 'Error',
      onClick: () => setStatusFilter('error'),
      icon: statusFilter === 'error' ? <Check size={14} className="text-navy-700" /> : <div className="w-[14px]" />,
    },
  ];

  return (
    <PageContainer
      title="Datasets"
      action={
        <Button onClick={() => navigate('/datasets/upload')} className="flex items-center gap-2">
          <Database size={18} />
          Upload Dataset
        </Button>
      }
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
            <span className="text-sm font-medium text-text-secondary">Dataset Distribution</span>
            <span className="text-sm font-bold text-text-primary">{statsData.total} Total Datasets</span>
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
            <span className="font-semibold">Failed to load datasets. Please try again.</span>
          </div>
        </Card>
      )}

      {datasetsData && (
        <>
          {datasetsData.datasets.length === 0 ? (
            <Card className="p-12 text-center">
              <Database className="w-12 h-12 text-grey-400 dark:text-text-tertiary mx-auto mb-4" />
              <p className="text-grey-900 dark:text-text-primary font-semibold mb-2">No datasets found</p>
              <p className="text-grey-500 dark:text-text-tertiary text-sm">
                No datasets are currently available
              </p>
            </Card>
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-sm uppercase text-text-primary font-semibold tracking-wider">
                        <th className="px-6 py-4 w-[20%] relative pl-[34px]">Name</th>
                        <th className="px-6 py-4 w-[20%] pl-20">Status</th>
                        <th className="px-6 py-4 w-[20%] pl-12">File Type</th>
                        <th className="px-6 py-4 w-[20%] pl-16">Rows</th>
                        <th className="px-6 py-4 w-[20%]">Created</th>
                        <th className="px-6 py-4 w-[5%] text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {datasetsData.datasets.map((dataset) => (
                        <DatasetRow key={dataset.id} dataset={dataset} />
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
              {datasetsData.total > 0 && (
                <p className="text-center text-grey-500 dark:text-text-tertiary text-sm mt-4">
                  Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
                  {Math.min(page * PAGE_SIZE, datasetsData.total)} of {datasetsData.total} datasets
                </p>
              )}
            </>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default DatasetsList;

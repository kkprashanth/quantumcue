/**
 * Dataset detail page.
 */

import { useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Database, FileText, Calendar, User, Trash2,
  BarChart3, Users, Settings, Code2, Hash, HardDrive,
  Activity, Info
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useDataset, useDeleteDataset } from '@/hooks/useDatasets';

export const DatasetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const deleteDataset = useDeleteDataset();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Disable query if we're deleting to prevent refetch after deletion
  const { data: dataset, isLoading, error } = useDataset(isDeleting ? null : id || null);

  const handleDelete = async () => {
    if (!id) return;
    try {
      setIsDeleting(true);
      setShowDeleteConfirm(false);
      // Navigate immediately to prevent query refetch
      navigate('/datasets');
      // Then delete
      await deleteDataset.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete dataset:', error);
      setIsDeleting(false);
      // Navigate back if deletion failed
      navigate(`/datasets/${id}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  if (isLoading) {
    return (
      <PageContainer title="Dataset Details">
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  if (error || !dataset) {
    return (
      <PageContainer title="Dataset Details">
        <div className="text-center py-12">
          <p className="text-red-500 font-medium">Dataset not found</p>
          <Link to="/datasets" className="text-brand-50 hover:underline mt-4 inline-block">
            Back to Datasets
          </Link>
        </div>
      </PageContainer>
    );
  }

  // Data processing
  const extractedLabels = dataset?.extracted_labels;
  const splitEstimates = dataset?.split_estimates;
  const statistics = dataset?.statistics;
  const labelingStructure = dataset?.labeling_structure;

  const records = extractedLabels?.patients || [];
  const classifications = extractedLabels?.classifications || {};

  const statsTotalRecords = statistics?.total_records ?? statistics?.total_patients;
  const totalRecordsCount = typeof statsTotalRecords === 'number'
    ? statsTotalRecords
    : (typeof statsTotalRecords === 'string'
      ? parseInt(statsTotalRecords as string, 10) || 0
      : (Array.isArray(records) ? records.length : 0));

  const classificationsCount = classifications && typeof classifications === 'object'
    ? Object.keys(classifications).length
    : 0;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(statistics && Object.keys(statistics).length > 0 ? [{ id: 'statistics', label: 'Statistics' }] : []),
    ...(dataset.metadata && Object.keys(dataset.metadata).length > 0 ? [{ id: 'metadata', label: 'Metadata' }] : []),
  ];

  return (
    <PageContainer>
      {/* Back button */}
      <button
        onClick={() => navigate('/datasets')}
        className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Datasets</span>
      </button>

      <Tabs tabs={tabs} defaultTab={tabParam && tabs.some(t => t.id === tabParam) ? tabParam : "overview"}>
        {(activeTab) => (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
                  {/* Background decorative element */}
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-gray-900">
                    <Database size={300} />
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center shadow-sm flex-shrink-0">
                        <Database className="w-8 h-8 text-brand-50" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                            {dataset.name}
                          </h1>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${dataset.status === 'ready'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : dataset.status === 'error'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            }`}>
                            {dataset.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs font-mono px-2.5 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700">
                            {dataset.file_format.toUpperCase()}
                          </span>
                          <span className="text-xs font-mono px-2.5 py-1 rounded border bg-gray-50 border-gray-200 text-gray-700">
                            {dataset.data_type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Button
                        onClick={() => setShowDeleteConfirm(true)}
                        variant="danger"
                        className="flex-1 md:flex-none"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Dataset
                      </Button>
                    </div>
                  </div>

                  {dataset.description && (
                    <p className="relative z-10 text-gray-600 mt-6 max-w-3xl text-lg leading-relaxed border-l-2 border-brand-50 pl-4">
                      {dataset.description}
                    </p>
                  )}

                  {/* Quick Stats */}
                  <div className="relative z-10 flex flex-col w-full justify-between md:flex-row gap-4 mt-8">
                    <div className="bg-gray-50 border w-full border-gray-200 rounded-xl p-4 transition-colors group items-center justify-center flex flex-col">
                      <div className="flex items-center gap-2 text-gray-500 mb-3">
                        <FileText size={16} className="text-brand-50" />
                        <span className="text-xs font-medium uppercase tracking-wider">Format</span>
                      </div>
                      <p className="text-2xl font-mono font-bold text-gray-900 uppercase">
                        {dataset.file_format}
                      </p>
                    </div>

                    <div className="bg-gray-50 border w-full border-gray-200 rounded-xl p-4 transition-colors group items-center justify-center flex flex-col">
                      <div className="flex items-center gap-2 text-gray-500 mb-3">
                        <Users size={16} className="text-brand-50" />
                        <span className="text-xs font-medium uppercase tracking-wider">Records</span>
                      </div>
                      <p className="text-2xl font-mono font-bold text-gray-900">
                        {totalRecordsCount.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-gray-50 border w-full border-gray-200 rounded-xl p-4 transition-colors group items-center justify-center flex flex-col">
                      <div className="flex items-center gap-2 text-gray-500 mb-3">
                        <HardDrive size={16} className="text-brand-50" />
                        <span className="text-xs font-medium uppercase tracking-wider">Size</span>
                      </div>
                      <p className="text-2xl font-mono font-bold text-gray-900">
                        {formatFileSize(dataset.file_size_bytes)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2-Column Card Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-8">
                    {/* Dataset Information Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-violet-500/30 transition-all duration-300 group">
                      <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
                        <HardDrive size={200} />
                      </div>
                      <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4 right-2">
                        <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-brand-50">
                          <Info size={20} />
                        </div>
                        Dataset Information
                      </h3>
                      <div className="relative z-10 space-y-5">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Format</span>
                            <p className="text-gray-900 font-medium uppercase">{dataset.file_format}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Type</span>
                            <p className="text-gray-900 font-medium capitalize">{dataset.data_type}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Status</span>
                            <p className="text-gray-900 font-medium capitalize">{dataset.status}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Size</span>
                            <p className="text-gray-900 font-medium">{formatFileSize(dataset.file_size_bytes)}</p>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">File Path</span>
                          <code className="text-gray-700 text-xs font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200 block break-all">
                            {dataset.file_path}
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Label Structure Card */}
                    {totalRecordsCount > 0 && (
                      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-violet-500/30 transition-all duration-300 group">
                        <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
                          <Users size={200} />
                        </div>
                        <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4 right-2">
                          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-brand-50">
                            <Users size={20} />
                          </div>
                          Label Structure
                        </h3>
                        <div className="relative z-10 space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Total Records</span>
                              <p className="text-2xl font-bold text-gray-900">{totalRecordsCount}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Classifications</span>
                              <p className="text-2xl font-bold text-gray-900">{classificationsCount}</p>
                            </div>
                          </div>

                          {classificationsCount > 0 && (
                            <div className="pt-4 border-t border-gray-100">
                              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-3">Records by Classification</span>
                              <div className="space-y-3">
                                {Object.entries(classifications).map(([classification, count]) => (
                                  <div key={classification} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 capitalize">{classification}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-violet-50 text-brand-50 text-xs font-bold border border-violet-100">
                                      {count as number}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Processing Configuration Card
                    {(labelingStructure || extractedLabels) && (
                      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-violet-500/30 transition-all duration-300 group">
                        <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
                          <Settings size={200} />
                        </div>
                        <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4 right-2">
                          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-brand-50">
                            <Settings size={20} />
                          </div>
                          Processing Configuration
                        </h3>
                        <div className="relative z-10 space-y-4">
                          {!!labelingStructure?.regex && (
                            <div>
                              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-2">
                                <Code2 className="w-4 h-4" />
                                Labeling Pattern (Regex)
                              </span>
                              <code className="text-sm text-brand-50 font-mono bg-violet-50/50 p-3 rounded-lg border border-violet-100 block break-all">
                                {labelingStructure.regex as string}
                              </code>
                              {!!labelingStructure.description && (
                                <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                                  {labelingStructure.description as string}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )} */}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-8">
                    {/* Details Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-violet-500/30 transition-all duration-300 group h-[50%]">
                      <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
                        <Hash size={200} />
                      </div>
                      <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4 right-3">
                        <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-brand-50">
                          <Hash size={20} />
                        </div>
                        Details
                      </h3>
                      <div className="relative z-10 space-y-5">
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Created By</span>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900 font-medium">{dataset.created_by_name || 'Unknown'}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Created At</span>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900 font-medium">{new Date(dataset.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Split Estimates Card */}
                    {!!splitEstimates && !!splitEstimates.total && (
                      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-violet-500/30 transition-all duration-300 group h-[46%]">
                        <div className="absolute -right-4 -top-4 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-gray-900">
                          <BarChart3 size={200} />
                        </div>
                        <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm text-brand-50">
                            <BarChart3 size={20} />
                          </div>
                          Split Estimates
                        </h3>
                        <div className="relative z-10 grid grid-cols-3 gap-4">
                          <div className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Training</p>
                            <p className="text-xl font-bold text-gray-900">
                              {Number(splitEstimates?.train) || 0}
                            </p>
                            <p className="text-xs text-brand-50 font-medium mt-1">
                              {Number(splitEstimates?.percentages?.train) || 0}%
                            </p>
                          </div>
                          <div className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Validation</p>
                            <p className="text-xl font-bold text-gray-900">
                              {Number(splitEstimates?.validation) || 0}
                            </p>
                            <p className="text-xs text-brand-50 font-medium mt-1">
                              {Number(splitEstimates?.percentages?.validation) || 0}%
                            </p>
                          </div>
                          <div className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Test</p>
                            <p className="text-xl font-bold text-gray-900">
                              {Number(splitEstimates?.test) || 0}
                            </p>
                            <p className="text-xs text-brand-50 font-medium mt-1">
                              {Number(splitEstimates?.percentages?.test) || 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'statistics' && statistics && (
              <Card title="Detailed Statistics" padding="lg">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <pre className="text-sm font-mono text-gray-800 overflow-auto max-h-[600px] leading-relaxed">
                    {JSON.stringify(statistics, null, 2)}
                  </pre>
                </div>
              </Card>
            )}

            {activeTab === 'metadata' && dataset.metadata && (
              <Card title="Additional Metadata" padding="lg">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <pre className="text-sm font-mono text-gray-800 overflow-auto max-h-[600px] leading-relaxed">
                    {JSON.stringify(dataset.metadata, null, 2)}
                  </pre>
                </div>
              </Card>
            )}
          </>
        )}
      </Tabs>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Dataset"
        message={`Are you sure you want to delete "${dataset.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteDataset.isPending}
      />
    </PageContainer>
  );
};

export default DatasetDetail;

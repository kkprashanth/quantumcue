import React from 'react';
import { useDatasets } from '../../hooks/useDatasets';
import { useProviders } from '../../hooks/useProviders';
import { Card } from '../ui/Card';
import { File, Check, Loader2, AlertCircle, Filter } from 'lucide-react';

import { type Dataset } from '@/types';

interface ExistingDatasetsListProps {
    selectedDatasetId: string | null;
    onSelect: (dataset: Dataset | null) => void;
}

export const ExistingDatasetsList: React.FC<ExistingDatasetsListProps> = ({
    selectedDatasetId,
    onSelect,
}) => {
    const [providerFilter, setProviderFilter] = React.useState<string | undefined>();
    const [dateFilter, setDateFilter] = React.useState<string | undefined>();
    const { data: providersData } = useProviders({ include_inactive: false });
    const { data, isLoading, isError } = useDatasets({
        page_size: 10,
        status: 'ready',
        provider_id: providerFilter,
        created_date: dateFilter,
        timezone_offset: new Date().getTimezoneOffset(),
    });

    const datasets = data?.datasets || [];
    const providers = providersData?.providers || [];

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                <h3 className="text-sm font-medium text-text-secondary">Select a previous dataset:</h3>

                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                            Filter by provider
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Filter className="w-3.5 h-3.5 text-text-tertiary" />
                            </div>
                            <select
                                value={providerFilter || ''}
                                onChange={(e) => setProviderFilter(e.target.value || undefined)}
                                className="pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-surface border border-grey-200 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 appearance-none cursor-pointer text-text-primary min-w-[150px]"
                            >
                                <option value="">All Providers</option>
                                {providers.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                            Filter by date
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={dateFilter || ''}
                                onChange={(e) => setDateFilter(e.target.value || undefined)}
                                className="pl-3 pr-3 py-1.5 text-xs bg-white dark:bg-surface border border-grey-200 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 appearance-none cursor-pointer text-text-primary"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8 border border-grey-200 dark:border-border rounded-xl bg-grey-50/50 dark:bg-surface/50">
                    <Loader2 className="w-8 h-8 text-navy-500 animate-spin mb-2" />
                    <p className="text-sm text-text-secondary">Loading datasets...</p>
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center p-8 border border-error-200 dark:border-error-900/30 rounded-xl bg-error-50 dark:bg-error-900/10">
                    <AlertCircle className="w-8 h-8 text-error-500 mb-2" />
                    <p className="text-sm text-error-600">Failed to load existing datasets.</p>
                </div>
            ) : datasets.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-grey-200 dark:border-border rounded-xl">
                    <p className="text-sm text-text-tertiary">
                        {providerFilter
                            ? "No datasets found for the selected provider."
                            : "No previously uploaded datasets found."
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {datasets.map((dataset) => {
                        const isSelected = selectedDatasetId === dataset.id;

                        return (
                            <div
                                key={dataset.id}
                                onClick={() => onSelect(isSelected ? null : dataset)}
                                className={`
                group cursor-pointer relative p-4 rounded-xl border-2 transition-all
                ${isSelected
                                        ? 'border-navy-500 bg-navy-50/50 dark:bg-navy-900/20'
                                        : 'border-grey-200 dark:border-border hover:border-navy-300 dark:hover:border-navy-700 bg-white dark:bg-surface'
                                    }
              `}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`
                  p-2 rounded-lg transition-colors
                  ${isSelected ? 'bg-navy-500 text-white' : 'bg-grey-100 dark:bg-surface-elevated text-text-tertiary group-hover:bg-navy-100 dark:group-hover:bg-navy-900/40 group-hover:text-navy-600'}
                `}>
                                        <File className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-navy-900 dark:text-navy-100' : 'text-text-primary'}`}>
                                            {dataset.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-grey-100 dark:bg-surface-elevated text-text-tertiary uppercase">
                                                {dataset.file_format}
                                            </span>
                                            <span className="text-xs text-text-tertiary">
                                                {(dataset.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                                            </span>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="text-navy-500">
                                            <Check className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

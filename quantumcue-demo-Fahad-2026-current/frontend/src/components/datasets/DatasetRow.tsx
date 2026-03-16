import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, FileText, Calendar, User, Trash2, MoreVertical, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useDeleteDataset } from '@/hooks/useDatasets';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import type { Dataset } from '@/types';

interface DatasetRowProps {
    dataset: Dataset;
}

export const DatasetRow = ({ dataset }: DatasetRowProps) => {
    const navigate = useNavigate();
    const deleteDataset = useDeleteDataset();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const handleDelete = async () => {
        try {
            await deleteDataset.mutateAsync(dataset.id);
            setShowDeleteConfirm(false);
            setShowMenu(false);
        } catch (error) {
            console.error('Failed to delete dataset:', error);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ready':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" />
                        Ready
                    </span>
                );
            case 'processing':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Clock className="w-3 h-3 animate-spin-slow" />
                        Processing
                    </span>
                );
            case 'uploading':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                        <Clock className="w-3 h-3" />
                        Uploading
                    </span>
                );
            case 'error':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <AlertCircle className="w-3 h-3" />
                        Error
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                        {status}
                    </span>
                );
        }
    };

    return (
        <>
            <tr
                className="hover:bg-gray-50 transition-colors cursor-pointer group border-b border-gray-100 last:border-0"
                onClick={() => navigate(`/datasets/${dataset.id}`)}
            >
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 flex-shrink-0 text-indigo-600">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">{dataset.name}</div>
                            {dataset.description && (
                                <div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{dataset.description}</div>
                            )}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 pl-20">
                    {getStatusBadge(dataset.status)}
                </td>
                <td className="px-6 py-4 pl-12">
                    <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-700">
                            <FileText className="w-3.5 h-3.5 text-gray-400" />
                            <span className="uppercase font-mono text-xs">{dataset.file_format}</span>
                            <span className="text-gray-300">|</span>
                            <span className="capitalize">{dataset.data_type}</span>
                        </div>
                        <div className="text-xs text-gray-500 pl-5">
                            {formatFileSize(dataset.file_size_bytes)}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 pl-16">
                    {dataset.row_count ? (
                        <span className="font-mono text-sm text-gray-700">
                            {dataset.row_count.toLocaleString()}
                        </span>
                    ) : (
                        <span className="text-gray-400">-</span>
                    )}
                </td>
                <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-sm">
                        {dataset.created_by_name && (
                            <div className="flex items-center gap-1.5 text-gray-700">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                <span>{dataset.created_by_name}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs pl-5">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{formatDate(dataset.created_at)}</span>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="relative inline-block text-left">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowMenu(false);
                                    }}
                                />
                                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowDeleteConfirm(true);
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Dataset
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </td>
            </tr>

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
        </>
    );
};

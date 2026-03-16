import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Activity, Calendar, User, Trash2, MoreVertical, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useDeleteModel } from '@/hooks/useModels';
import type { Model } from '@/types';

interface ModelRowProps {
    model: Model;
}

export const ModelRow = ({ model }: ModelRowProps) => {
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const deleteModelMutation = useDeleteModel();

    const handleDelete = async () => {
        try {
            await deleteModelMutation.mutateAsync(model.id);
            setShowDeleteConfirm(false);
            setShowMenu(false);
        } catch (error) {
            console.error('Failed to delete model:', error);
        }
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
            case 'hosted_active':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" />
                        Active
                    </span>
                );
            case 'ready':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <CheckCircle className="w-3 h-3" />
                        Ready
                    </span>
                );
            case 'training':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                        <Clock className="w-3 h-3 animate-spin-slow" />
                        Training
                    </span>
                );
            case 'error':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <AlertCircle className="w-3 h-3" />
                        Error
                    </span>
                );
            case 'archived':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                        Archived
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                        {status.replace('_', ' ')}
                    </span>
                );
        }
    };

    const getModelTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            qnn: 'Quantum Neural Network',
            vqc: 'Variational Quantum Classifier',
            qsvm: 'Quantum SVM',
            generative: 'Generative Model',
            custom: 'Custom Model',
        };
        return labels[type] || type;
    };

    return (
        <>
            <tr
                className="hover:bg-gray-50 transition-colors cursor-pointer group border-b border-gray-100 last:border-0"
                onClick={() => navigate(`/models/${model.id}`)}
            >
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg border border-purple-100 flex-shrink-0 text-purple-600">
                            <Brain className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="font-medium text-gray-900">{model.name}</div>
                                {/* {model.display_id && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono">
                                        {model.display_id}
                                    </span>
                                )} */}
                            </div>
                            {model.description && (
                                <div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{model.description}</div>
                            )}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    {getStatusBadge(model.status)}
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Zap className="w-3.5 h-3.5 text-gray-400" />
                        <span>{getModelTypeLabel(model.model_type)}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 font-mono">
                        <Activity className="w-3.5 h-3.5 text-gray-400" />
                        <span>{model.prediction_count.toLocaleString()}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 font-mono">
                        {model.average_confidence != null ? (
                            <span>{(model.average_confidence * 100).toFixed(1)}%</span>
                        ) : (
                            <span className="text-gray-400">-</span>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-sm">
                        {model.provider_name && (
                            <div className="text-gray-700 capitalize">{model.provider_name}</div>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDate(model.last_used_at || model.created_at)}</span>
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
                                        Delete Model
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
                title="Delete Model"
                message={`Are you sure you want to delete "${model.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                isLoading={deleteModelMutation.isPending}
            />
        </>
    );
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Cpu, User, Trash2, MoreVertical, Zap, Calendar } from 'lucide-react';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { JobStatusBadge } from './JobStatusBadge';
import { type JobSummary, getJobTypeLabel, getJobPriorityConfig } from '../../api/endpoints/jobs';
import { useDeleteJob } from '../../hooks/useJobs';

interface JobRowProps {
    job: JobSummary;
}

export const JobRow = ({ job }: JobRowProps) => {
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const priorityConfig = getJobPriorityConfig(job.priority);

    const deleteMutation = useDeleteJob();
    const isDeletable = true; // Allow deleting all jobs as per user request

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync(job.id);
            setShowDeleteConfirm(false);
            setShowMenu(false);
        } catch (error) {
            console.error('Failed to delete job:', error);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <tr
                className="hover:bg-gray-50 transition-colors cursor-pointer group border-b border-gray-100 last:border-0"
                onClick={() => navigate(`/jobs/${job.id}`)}
            >
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 flex-shrink-0 text-blue-600">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">{job.name}</div>
                            {job.description && (
                                <div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{job.description}</div>
                            )}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <JobStatusBadge status={job.status} size="sm" showDot={true} />
                </td>
                <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">
                        {getJobTypeLabel(job.job_type)}
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm">
                        <Zap className={`w-3.5 h-3.5 ${priorityConfig.color}`} />
                        <span className={priorityConfig.color}>{priorityConfig.label}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-sm">
                        {job.provider_name && (
                            <div className="text-gray-700 capitalize">{job.provider_name}</div>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDate(job.completed_at || job.submitted_at || job.created_at)}</span>
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
                                    className="fixed inset-0 z-999 "
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowMenu(false);
                                    }}
                                />
                                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                                    {isDeletable && (
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
                                            Delete Job
                                        </button>
                                    )}
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
                title="Delete Job"
                message={`Are you sure you want to delete "${job.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
            />
        </>
    );
};

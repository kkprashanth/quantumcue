import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, RefreshCw, MoreVertical, Shield, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal, ModalActions } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Dropdown } from '../../components/ui/Dropdown';
import { toast } from 'sonner';
import * as adminCodesApi from '../../api/endpoints/adminCodes';

const ExpirationTimer = ({ createdAt, expiresIn = 24 }: { createdAt: string; expiresIn?: number }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const created = new Date(createdAt).getTime();
            const expiresAt = created + expiresIn * 60 * 60 * 1000;
            const now = new Date().getTime();
            const difference = expiresAt - now;

            if (difference < 0) {
                setIsExpired(true);
                return;
            }

            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft(); // Initial call

        return () => clearInterval(timer);
    }, [createdAt]);

    if (isExpired) return null;

    return (
        <div className="flex items-center justify-center text-xs text-orange-600 font-mono font-normal mt-1">
            <Clock className="w-3 h-3 mr-1" />
            <span>Expires in {timeLeft}</span>
        </div>
    );
};

export const AccessCodeManagement = () => {
    const [codes, setCodes] = useState<adminCodesApi.AccessCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [customCode, setCustomCode] = useState('');
    const [customEmail, setCustomEmail] = useState('');
    const [customExpiresIn, setCustomExpiresIn] = useState('');

    const fetchCodes = async () => {
        setIsLoading(true);
        try {
            const data = await adminCodesApi.listCodes();
            setCodes(data);
        } catch (error) {
            console.error('Failed to fetch codes', error);
            toast.error('Failed to load access codes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCodes();
    }, []);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('Access code copied to clipboard');
    };

    const handleDelete = async (code: adminCodesApi.AccessCode) => {
        if (!window.confirm(`Are you sure you want to delete the code ${code.code}?`)) return;

        setIsActionLoading(true);
        try {
            await adminCodesApi.deleteCode(code.code);
            toast.success('Access code deleted');
            await fetchCodes();
        } catch (error) {
            console.error('Failed to delete code', error);
            toast.error('Failed to delete access code');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!customEmail.trim()) {
            toast.error('Recipient email is required');
            return;
        }

        setIsActionLoading(true);
        try {
            const expiresIn = customExpiresIn ? parseInt(customExpiresIn) || 24 : undefined;
            await adminCodesApi.createCode(customCode || undefined, customEmail.trim(), expiresIn);
            setCustomCode('');
            setCustomEmail('');
            setCustomExpiresIn('');
            setIsCreateModalOpen(false);
            toast.success('Access code created successfully');
            await fetchCodes();
        } catch (error) {
            console.error('Failed to create code', error);
            toast.error('Failed to create access code');
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Keys</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchCodes}
                        disabled={isLoading}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Key
                    </Button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="px-6 py-4 pl-8 w-[25%] border-r-2 text-center">Access Key</th>
                                <th className="px-6 py-4 w-[25%] text-center border-r-2">Status</th>
                                <th className="px-6 py-4 pr-8 w-[25%] text-center border-r-2">Details</th>
                                <th className="px-6 py-4 pr-10 w-[25%] border-r-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                                        </div>
                                    </td>
                                </tr>
                            ) : codes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="p-3 bg-gray-100 rounded-full mb-4">
                                                <Key className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-1">No Active Access Keys</h3>
                                            <p className="text-sm text-gray-500 mb-6">Generate a key to invite new users.</p>
                                            <Button
                                                onClick={() => setIsCreateModalOpen(true)}
                                                variant="secondary"
                                            >
                                                Generate First Key
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                codes.map((code) => (
                                    <tr key={code.code} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 border-r-2 text-center">
                                            <div className="flex items-center gap-3 justify-center">
                                                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 flex-shrink-0">
                                                    <Key className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <code className="text-sm font-mono font-normal text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                                                    {code.code}
                                                </code>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center border-r-2">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-mono font-normal border ${code.status === 'activated'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : code.status === 'expired'
                                                    ? 'bg-gray-50 text-gray-700 border-gray-200'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${code.status === 'activated' ? 'bg-emerald-500'
                                                    : code.status === 'expired' ? 'bg-gray-500'
                                                        : 'bg-blue-500'
                                                    }`}></span>
                                                {code.status === 'activated' ? 'Activated'
                                                    : code.status === 'expired' ? 'Expired'
                                                        : 'Issued'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center border-r-2">
                                            {code.status === 'activated' && code.user ? (
                                                <div className="flex flex-col">
                                                    <div className="font-medium text-gray-900 text-sm">{code.user.full_name}</div>
                                                    <div className="text-xs text-gray-500">{code.user.email}</div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    {code.status === 'issued' && <ExpirationTimer createdAt={code.created_at} expiresIn={code.expires_in} />}
                                                    {code.email && (
                                                        <div className="text-xs font-mono font-normal text-gray-500">
                                                            Reserved for: <span className="font-medium">{code.email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopy(code.code)}
                                                    className="h-8 px-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                                    title="Copy Code"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(code)}
                                                    className="h-8 px-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
                                                    title="Delete Code"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create Access Key"
                size="md"
            >
                <div className="space-y-4 py-4">

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Custom Code
                        </label>
                        <Input
                            placeholder="e.g. SUMMER-2024-INVITE"
                            value={customCode}
                            onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                        />
                        {/* <p className="text-xs text-gray-500">
                            Leave blank to generate a random secure code.
                        </p> */}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="user@example.com (Required)"
                            value={customEmail}
                            onChange={(e) => setCustomEmail(e.target.value)}
                            type="email"
                        />
                        {/* <p className="text-xs text-gray-500">
                            Restrict this code to a specific email address.
                        </p> */}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Expires In (Hours)
                        </label>
                        <Input
                            type="number"
                            min="1"
                            placeholder="24"
                            value={customExpiresIn}
                            onChange={(e) => setCustomExpiresIn(e.target.value)}
                        />
                        {/* <p className="text-xs text-gray-500">
                            Leave blank for default 24 hours.
                        </p> */}
                    </div>
                </div>
                <ModalActions>
                    <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} disabled={isActionLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={isActionLoading}
                    >
                        {isActionLoading ? 'Creating & Sending...' : 'Create & Send Key'}
                    </Button>
                </ModalActions>
            </Modal>
        </div>
    );
};

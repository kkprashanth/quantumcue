import { useState, useEffect } from 'react';
import { Users, Search, Filter, MoreVertical, Edit2, Trash2, CheckCircle, XCircle, Shield, User, Plus, Loader2, Calendar, Crown } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal, ModalActions } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { Pagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { Switch } from '../../components/ui/Switch';
import { listUsers, deactivateUser, updateUser, createUser, getAccount, getUser, exportUsers, type UserListItem, type AccountResponse, type UserCreate, type UserDetailResponse } from '../../api/endpoints/account';
import { listLoginActivity, type LoginHistoryEntry } from '../../api/endpoints/loginActivity';
import { useAuthContext } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export const UserManagement = () => {
    const { user: currentUser } = useAuthContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [account, setAccount] = useState<AccountResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'user',
        status: 'active',
        tier: 'free',
        logins: 5,
        login_count: 0,
        failed_login_count: 0,
        description: ''
    });

    const [isAccountDetailsModalOpen, setIsAccountDetailsModalOpen] = useState(false);
    const [selectedUserFull, setSelectedUserFull] = useState<UserDetailResponse | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // Login Activity Modal State
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [selectedUserForActivity, setSelectedUserForActivity] = useState<UserListItem | null>(null);
    const [userActivityLogs, setUserActivityLogs] = useState<LoginHistoryEntry[]>([]);
    const [isActivityLoading, setIsActivityLoading] = useState(false);
    const [activityPage, setActivityPage] = useState(1);
    const [activityTotal, setActivityTotal] = useState(0);
    const ACTIVITY_PAGE_SIZE = 10;

    const fetchUserActivity = async (userId: string, page: number) => {
        try {
            setIsActivityLoading(true);
            const data = await listLoginActivity(page, ACTIVITY_PAGE_SIZE, userId);
            setUserActivityLogs(data.items);
            setActivityTotal(data.total);
        } catch (error) {
            console.error('Failed to fetch user activity:', error);
            toast.error('Failed to load login activity');
        } finally {
            setIsActivityLoading(false);
        }
    };

    useEffect(() => {
        if (isActivityModalOpen && selectedUserForActivity) {
            fetchUserActivity(selectedUserForActivity.id, activityPage);
        }
    }, [activityPage, isActivityModalOpen, selectedUserForActivity]);

    const handleOpenActivity = (user: UserListItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedUserForActivity(user);
        setActivityPage(1);
        setIsActivityModalOpen(true);
    };

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState<UserCreate>({
        email: '',
        first_name: '',
        last_name: '',
        role: 'user',
        password: '',
        create_new_account: true,
        company_name: '',
        tier: 'free'
    });

    // Pagination state
    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const PAGE_SIZE = 5;

    // Filter state
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [loginFilter, setLoginFilter] = useState('all');

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [usersResponse, accountResponse] = await Promise.all([
                listUsers(page, PAGE_SIZE, {
                    role: roleFilter,
                    status: statusFilter,
                    login_filter: loginFilter
                }),
                getAccount()
            ]);
            setUsers(usersResponse.users);
            setAccount(accountResponse);
            setTotalPages(Math.ceil(usersResponse.total / PAGE_SIZE)); // Set total pages
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, statusFilter, roleFilter, loginFilter]); // Re-fetch when page or filters change

    useEffect(() => {
        if (selectedUser && account) {
            setEditForm({
                firstName: selectedUser.first_name || '',
                lastName: selectedUser.last_name || '',
                email: selectedUser.email,
                role: selectedUser.role,
                status: selectedUser.account_status || selectedUser.status,
                tier: selectedUser.account_tier || account?.tier || 'free',
                logins: selectedUser.account_logins ?? 5,
                login_count: selectedUser.login_count ?? 0,
                failed_login_count: selectedUser.failed_login_count ?? 0,
                description: selectedUser.description || ''
            });
        }
    }, [selectedUser, account]);

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUpdateUser = async () => {
        if (!selectedUser) return;

        try {
            setIsUpdating(true);
            await updateUser(selectedUser.id, {
                email: editForm.email || undefined,
                first_name: editForm.firstName || undefined,
                last_name: editForm.lastName || undefined,
                role: editForm.role as 'admin' | 'superadmin' | 'user',
                status: editForm.status as 'active' | 'inactive',
                tier: editForm.tier as 'free' | 'starter' | 'professional' | 'enterprise',
                logins: editForm.logins,
                login_count: editForm.login_count,
                failed_login_count: editForm.failed_login_count,
                description: editForm.description || undefined
            });

            toast.success('User updated successfully');
            setIsEditModalOpen(false);
            setSelectedUser(null);
            fetchData();
        } catch (error: any) {
            console.error('Failed to update user:', error);
            let errorMessage = 'Failed to update user';
            if (error?.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRowClick = async (userId: string) => {
        try {
            setIsLoadingDetails(true);
            const data = await getUser(userId);
            setSelectedUserFull(data);
            setIsAccountDetailsModalOpen(true);
        } catch (error) {
            console.error('Failed to fetch user details:', error);
            toast.error('Failed to load user details');
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const data = await exportUsers();

            // Convert to CSV
            if (data.length === 0) {
                toast.error('No users to export');
                return;
            }

            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row =>
                Object.values(row).map(value => {
                    const stringValue = value === null ? '' : String(value);
                    // Escape quotes and wrap in quotes if contains comma
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }).join(',')
            );

            const csvContent = [headers, ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Export completed successfully');
        } catch (error) {
            console.error('Failed to export users:', error);
            toast.error('Failed to export users');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDelete = async () => {
        if (selectedUser) {
            try {
                await deactivateUser(selectedUser.id);
                toast.success('User deactivated successfully');
                setIsDeleteModalOpen(false);
                setDeleteConfirmation('');
                setSelectedUser(null);
                fetchData(); // Refresh list to show updated status
            } catch (error) {
                console.error('Failed to delete user:', error);
                toast.error('Failed to delete user');
            }
        }
    };

    const handleCreateUser = async () => {
        if (!createForm.email || !createForm.first_name || !createForm.last_name) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setIsCreating(true);
            const response = await createUser(createForm);

            toast.success(
                <div className="flex flex-col gap-1">
                    <span className="font-medium">User created successfully!</span>
                    {response.temporary_password && (
                        <div className="text-xs bg-white/10 p-2 rounded mt-1">
                            <div className="opacity-80 mb-1">Temporary Password:</div>
                            <code className="font-mono select-all bg-black/20 px-1.5 py-0.5 rounded">{response.temporary_password}</code>
                        </div>
                    )}
                </div>,
                { duration: 8000 } // Longer duration to allow copying password
            );

            setIsCreateModalOpen(false);
            setCreateForm({
                email: '',
                first_name: '',
                last_name: '',
                role: 'user',
                password: '',
                create_new_account: false,
                company_name: '',
                tier: 'starter'
            });
            fetchData();
        } catch (error: any) {
            console.error('Failed to create user:', error);

            let message = 'Failed to create user';
            const detail = error.response?.data?.detail;

            if (detail) {
                if (Array.isArray(detail)) {
                    // Handle validation errors (422)
                    const passwordError = detail.find((e: any) => e.loc.includes('password'));
                    if (passwordError) {
                        if (passwordError.type === 'string_too_short') {
                            message = `Password must be at least ${passwordError.ctx?.min_length || 8} characters long`;
                        } else {
                            message = passwordError.msg;
                        }
                    } else {
                        // Join all error messages
                        message = detail.map((e: any) => e.msg).join('. ');
                    }
                } else {
                    // Handle standard errors (400, 401, etc)
                    message = String(detail);
                }
            }

            toast.error(message);
        } finally {
            setIsCreating(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const isActive = status === 'active';
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {status.toUpperCase()}
            </span>
        );
    };

    const RoleBadge = ({ role }: { role: string }) => {
        if (role === 'superadmin') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
                    <Crown size={12} />
                    {role.toUpperCase()}
                </span>
            );
        }
        const isAdmin = role === 'admin';
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${isAdmin ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                {isAdmin ? <Shield size={12} /> : <User size={12} />}
                {role.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
                    {/* <p className="text-gray-500">Manage user access and permissions</p> */}
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1 rounded-lg border border-gray-200 flex items-center shadow-sm">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                'Export'
                            )}
                        </Button>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <select
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="all">All Roles</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                    </select>

                    <select
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={loginFilter}
                        onChange={(e) => {
                            setLoginFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="all">All Logins</option>
                        <option value="lt_2">Less than 2</option>
                        <option value="eq_2">Equal to 2</option>
                        <option value="gt_2">Greater than 2</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="px-6 py-4 w-[30%] pl-8 border-r-2 text-center">User</th>
                                <th className="px-6 py-4 w-[30%] pl-8 border-r-2 text-center">Role & Status</th>
                                <th className="px-6 py-4 w-[25%] border-r-2 text-center">Account</th>
                                <th className="px-6 py-4 w-[17%] border-r-2">Last Seen</th>
                                <th className="px-6 py-4 w-[17%] pr-10 text-center border-r-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                        onClick={() => handleRowClick(user.id)}
                                    >
                                        <td className="px-6 py-4 border-r-2">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 flex-shrink-0">
                                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-700 font-bold border border-blue-100 shadow-sm text-sm">
                                                        {user.first_name?.[0] || user.email[0].toUpperCase()}{user.last_name?.[0] || ''}
                                                    </div>
                                                </div>
                                                <div className="font-mono text-sm font-normal">
                                                    <div className="text-gray-900 mb-0.5">{user.full_name}</div>
                                                    <div className="text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r-2">
                                            <div className="flex items-center justify-center gap-2">
                                                <RoleBadge role={user.role} />
                                                <StatusBadge status={user.account_status || user.status} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r-2">
                                            <div className="flex flex-col gap-1 font-mono text-sm font-normal items-center">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-gray-400">Tier:</span>
                                                    <span className="capitalize text-gray-700">{user.account_tier}</span>
                                                </div>
                                                {user.account_tier === 'free' && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-gray-400">Logins:</span>
                                                        <span
                                                            className={(user.account_logins ?? 5) - (user.login_count ?? 0) > 0
                                                                ? "text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                                                : "text-red-600 cursor-pointer hover:text-red-700 hover:underline"}
                                                            onClick={(e) => handleOpenActivity(user, e)}
                                                            title="Click to view login activity"
                                                        >
                                                            {Math.max(0, (user.account_logins ?? 5) - (user.login_count ?? 0))} left
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r-2">
                                            <div className="flex items-center gap-1.5 font-mono text-sm font-normal text-gray-500">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span>
                                                    {user.last_login_at ? (
                                                        new Date(user.last_login_at).toLocaleDateString()
                                                    ) : (
                                                        'Never'
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r-2">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedUser(user);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="h-8 px-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                                    title="Edit User"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedUser(user);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="h-8 px-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
                                                    title="Delete User"
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            )}

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit User"
                size="md"
            >
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">First Name</label>
                            <Input
                                value={editForm.firstName}
                                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Last Name</label>
                            <Input
                                value={editForm.lastName}
                                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <Input
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            type="email"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Role</label>
                            <select
                                className={`w-full border rounded-lg px-3 py-2 focus:outline-none ${currentUser?.role === 'superadmin' ? 'bg-white border-black text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'}`}
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                                disabled={currentUser?.role !== 'superadmin'}
                                title={currentUser?.role === 'superadmin' ? 'Change user role' : 'Only superadmins can change roles'}
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="superadmin">Superadmin</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <select
                                className="w-full bg-white border border-black rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Failed Login Attempts</label>
                        <Input
                            type="number"
                            min="0"
                            value={editForm.failed_login_count}
                            onChange={(e) => setEditForm({ ...editForm, failed_login_count: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-gray-500">
                            Number of consecutive failed login attempts. Automatically resets on successful login. Set to 0 to unlock account.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            className="w-full bg-white border border-black rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[80px]"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            placeholder="User description..."
                        />
                    </div>

                    <div className="space-y-2 pb-1 mt-2">
                        <label className="text-sm font-medium text-gray-700">Account Tier</label>
                        <p className="text-xs text-gray-500 mb-2">Updating this will change the tier for the entire account.</p>
                        <select
                            className="w-full bg-white border border-black rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={editForm.tier}
                            onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                        >
                            <option value="free">Free</option>
                            <option value="starter">Starter</option>
                            <option value="professional">Professional</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>

                    {editForm.tier === 'free' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Remaining Logins</label>
                            <Input
                                type="number"
                                min="0"
                                value={editForm.logins}
                                onChange={(e) => setEditForm({ ...editForm, logins: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-gray-500">
                                This is the total number of allowed sign-ins for this account.
                            </p>
                        </div>
                    )}

                    {editForm.tier === 'free' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Used Logins</label>
                            <Input
                                type="number"
                                min="0"
                                value={editForm.login_count}
                                onChange={(e) => setEditForm({ ...editForm, login_count: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-gray-500">
                                Current sign-in count. Reset to 0 to restore access.
                            </p>
                        </div>
                    )}
                </div>
                <ModalActions>
                    <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} disabled={isUpdating}>Cancel</Button>
                    <Button onClick={handleUpdateUser} disabled={isUpdating}>
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                </ModalActions>
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete User"
                size="md"
            >
                <div className="flex flex-col items-center py-6 px-4">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <Trash2 className="w-10 h-10 text-red-600" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                        Delete User Account?
                    </h3>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 w-full">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-700">
                                <p className="font-semibold mb-1">Warning: This action is irreversible</p>
                                <p>
                                    All data associated with <span className="font-bold">{selectedUser?.full_name}</span> will be permanently deleted. They will lose access immediately.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            To confirm, please type <span className="font-mono font-bold select-all">DELETE</span> below:
                        </label>
                        <Input
                            placeholder="Type DELETE to confirm"
                            className="border-red-300 focus:border-red-500 focus:ring-red-500/20"
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Are you absolutely sure you want to proceed?
                        </p>
                    </div>
                </div>
                <ModalActions className="bg-gray-50 px-6 py-4 -mx-6 -mb-6 mt-6 border-t border-gray-100">
                    <Button variant="ghost" onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmation(''); }}>Cancel</Button>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        className="shadow-lg shadow-red-500/20"
                        disabled={deleteConfirmation !== 'DELETE'}
                    >
                        Yes, Delete User
                    </Button>
                </ModalActions>
            </Modal>

            <Modal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                title={`Login Activity: ${selectedUserForActivity?.email}`}
                size="lg"
            >
                <div className="py-4">
                    {isActivityLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : userActivityLogs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 italic">
                            No login activity found for this user.
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {userActivityLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${log.status === 'success'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-red-50 text-red-700'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                        {log.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-gray-500">
                                    Page {activityPage} of {Math.ceil(activityTotal / ACTIVITY_PAGE_SIZE) || 1}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={activityPage === 1 || isActivityLoading}
                                        onClick={() => setActivityPage(p => p - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={activityPage >= Math.ceil(activityTotal / ACTIVITY_PAGE_SIZE) || isActivityLoading}
                                        onClick={() => setActivityPage(p => p + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <ModalActions>
                    <Button onClick={() => setIsActivityModalOpen(false)}>Close</Button>
                </ModalActions>
            </Modal>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Add New User"
                size="md"
            >
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email Address <span className="text-red-500">*</span></label>
                        <Input
                            placeholder="john@example.com"
                            value={createForm.email}
                            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                            className="!hover:border-blue-600 border-black"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
                            <Input
                                placeholder="John"
                                value={createForm.first_name}
                                onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                                className="!hover:border-blue-600 border-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></label>
                            <Input
                                placeholder="Doe"
                                value={createForm.last_name}
                                onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                                className="!hover:border-blue-600 border-black"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Role</label>
                        <select
                            className="w-full bg-white border border-black rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-600 transition-colors"
                            value={createForm.role}
                            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'admin' | 'user' })}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                        <p className="text-xs text-gray-500">
                            Admins have full access to account settings and user management.
                        </p>
                    </div>

                    <div className="space-y-4 border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium text-gray-900">Provision New Account</label>
                                <p className="text-xs text-gray-500">Create a new tenant account for this user</p>
                            </div>
                            <Switch
                                checked={createForm.create_new_account}
                                onCheckedChange={(checked) => setCreateForm({ ...createForm, create_new_account: checked })}
                            />
                        </div>

                        {createForm.create_new_account && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Company Name <span className="text-red-500">*</span></label>
                                    <Input
                                        placeholder="Acme Corp"
                                        value={createForm.company_name}
                                        onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
                                        required={createForm.create_new_account}
                                        className="!hover:border-blue-600 border-black"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Account Tier</label>
                                    <select
                                        className="w-full bg-white border border-black rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-600 transition-colors"
                                        value={createForm.tier}
                                        onChange={(e) => setCreateForm({ ...createForm, tier: e.target.value as any })}
                                    >
                                        <option value="free">Free</option>
                                        <option value="starter">Starter</option>
                                        <option value="professional">Professional</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="text-sm font-medium text-gray-700">Password <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <Input
                            type="password"
                            placeholder="Auto-generated if empty"
                            value={createForm.password}
                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                            className="!hover:border-blue-600 border-black"
                        />
                        <p className="text-xs text-gray-500">
                            Create a specific password or leave blank to auto-generate a secure one.
                        </p>
                    </div>
                </div>
                <ModalActions>
                    <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>Cancel</Button>
                    <Button onClick={handleCreateUser} disabled={isCreating}>
                        {isCreating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                Create User
                            </>
                        )}
                    </Button>
                </ModalActions>
            </Modal>
            <Modal
                isOpen={isAccountDetailsModalOpen}
                onClose={() => setIsAccountDetailsModalOpen(false)}
                title="Account Details"
                size="lg"
            >
                {isLoadingDetails ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-500">Loading account details...</p>
                    </div>
                ) : selectedUserFull?.account ? (
                    <div className="space-y-6 py-4">
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
                                    {selectedUserFull.account.name[0]}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{selectedUserFull.account.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <StatusBadge status={selectedUserFull.account.status} />
                                        <Badge variant="default" className="capitalize">{selectedUserFull.account.tier}</Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                {/* Account Info */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-900 pb-1 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                        General Information
                                    </h4>
                                    <div className="grid gap-3">
                                        <div className="p-3 rounded-lg border border-gray-100 bg-gray-100">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Description</span>
                                            <span className="text-sm text-gray-600 leading-relaxed">{selectedUserFull.description || <span className="italic text-gray-400">No description provided</span>}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Usage & Stats */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-900 pb-1 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                                        Usage & Limits
                                    </h4>

                                    <div className="p-3 rounded-lg border border-gray-100 bg-gray-100">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Data Usage</span>
                                            <span className="font-medium text-gray-900">
                                                {selectedUserFull.account.data_used_mb} / {selectedUserFull.account.data_budget_mb} MB
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-500 ${selectedUserFull.account.data_usage_percentage > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                style={{ width: `${Math.min(100, selectedUserFull.account.data_usage_percentage)}%` }}
                                            />
                                        </div>
                                        <div className="mt-1 text-right text-xs text-gray-400">{selectedUserFull.account.data_usage_percentage.toFixed(1)}% Used</div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-100">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Execution Time</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sm text-gray-900 font-medium">
                                                    {selectedUserFull.account.time_remaining_seconds}s
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    / {selectedUserFull.account.total_time_allotted_seconds}s
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-100">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Logins</span>
                                            <span className="text-sm text-gray-900 font-medium">{selectedUserFull.account.logins} allowed</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-100">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Tokens</span>
                                            <span className="text-sm text-gray-900 font-medium">{selectedUserFull.account.llm_total_tokens.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 bg-emerald-50">
                                            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Cost</span>
                                            <span className="text-sm text-emerald-700 font-bold">${selectedUserFull.account.llm_total_cost.toFixed(4)}</span>
                                        </div>
                                    </div>

                                    {!!selectedUserFull.account.llm_usage_stats && !!selectedUserFull.account.llm_usage_stats.models_used && (
                                        <div className="p-3 rounded-lg border border-gray-100 bg-gray-100">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Models Used</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {Object.keys(selectedUserFull.account.llm_usage_stats.models_used).map((model) => (
                                                    <span key={model} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-700 shadow-sm">
                                                        {model}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-400 pt-4 border-t border-gray-100 flex justify-between">
                            <span>Created: {new Date(selectedUserFull.account.created_at).toLocaleString()}</span>
                            <span>Updated: {new Date(selectedUserFull.account.updated_at).toLocaleString()}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        Account details not available.
                    </div>
                )}
                <ModalActions>
                    <Button onClick={() => setIsAccountDetailsModalOpen(false)}>Close</Button>
                </ModalActions>
            </Modal>
        </div >
    );
};

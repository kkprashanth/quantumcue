/**
 * User management table component.
 */

import { Shield, User, MoreVertical, Edit, UserX, Crown } from 'lucide-react';
import type { UserListItem } from '../../api/endpoints/account';
import { Dropdown } from '../ui/Dropdown';

interface UserTableProps {
  users: UserListItem[];
  currentUserId: string;
  onEdit?: (user: UserListItem) => void;
  onDeactivate?: (user: UserListItem) => void;
}

const getRoleBadge = (role: 'admin' | 'superadmin' | 'user') => {
  if (role === 'superadmin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-medium">
        <Crown className="w-3 h-3" />
        Superadmin
      </span>
    );
  }
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded text-xs font-medium">
        <Shield className="w-3 h-3" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-background-tertiary text-text-secondary rounded text-xs font-medium">
      <User className="w-3 h-3" />
      User
    </span>
  );
};

const getStatusBadge = (status: 'active' | 'inactive' | 'pending') => {
  const styles = {
    active: 'bg-status-success/10 text-status-success',
    inactive: 'bg-status-error/10 text-status-error',
    pending: 'bg-status-warning/10 text-status-warning',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

interface DropdownItemType {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

export const UserTable = ({ users, currentUserId, onEdit, onDeactivate }: UserTableProps) => {
  const getDropdownItems = (user: UserListItem): DropdownItemType[] => {
    const items: DropdownItemType[] = [
      {
        label: 'Edit User',
        icon: <Edit className="w-4 h-4" />,
        onClick: () => onEdit?.(user),
      },
    ];

    if (user.status === 'active') {
      items.push({
        label: 'Deactivate',
        icon: <UserX className="w-4 h-4" />,
        onClick: () => onDeactivate?.(user),
        danger: true,
      });
    } else {
      items.push({
        label: 'Reactivate',
        icon: <User className="w-4 h-4" />,
        onClick: () => onEdit?.(user),
      });
    }

    return items;
  };

  return (
    <div className="bg-background-secondary border border-border-primary rounded-xl">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-primary">
            <th className="text-left px-6 py-4 text-xs font-medium text-text-tertiary uppercase tracking-wider first:rounded-tl-xl last:rounded-tr-xl border-r-2">
              User
            </th>
            <th className="text-left px-6 py-4 text-xs font-medium text-text-tertiary uppercase tracking-wider border-r-2">
              Role
            </th>
            <th className="text-left px-6 py-4 text-xs font-medium text-text-tertiary uppercase tracking-wider border-r-2">
              Status
            </th>
            <th className="text-left px-6 py-4 text-xs font-medium text-text-tertiary uppercase tracking-wider border-r-2">
              Last Login
            </th>
            <th className="text-left px-6 py-4 text-xs font-medium text-text-tertiary uppercase tracking-wider border-r-2">
              Joined
            </th>
            <th className="w-12 px-6 py-4 last:rounded-tr-xl border-r-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-primary">
          {users.map((user, index) => (
            <tr key={user.id} className="hover:bg-background-tertiary/50 transition-colors">
              <td className="px-6 py-4 border-r-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user.first_name?.[0] || user.email[0].toUpperCase()}
                      {user.last_name?.[0] || ''}
                    </span>
                  </div>
                  <div className="font-mono text-sm font-normal">
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary">
                        {user.full_name}
                      </span>
                      {user.id === currentUserId && (
                        <span className="text-text-tertiary">(you)</span>
                      )}
                    </div>
                    <span className="text-text-tertiary">{user.email}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 border-r-2">{getRoleBadge(user.role)}</td>
              <td className="px-6 py-4 border-r-2">{getStatusBadge(user.status)}</td>
              <td className="px-6 py-4 font-mono text-sm font-normal text-text-secondary border-r-2">
                {formatDate(user.last_login_at)}
              </td>
              <td className="px-6 py-4 font-mono text-sm font-normal text-text-secondary border-r-2">
                {formatDate(user.created_at)}
              </td>
              <td className="px-6 py-4 border-r-2">
                {user.id !== currentUserId && (
                  <Dropdown
                    trigger={
                      <div className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-background-tertiary transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </div>
                    }
                    items={getDropdownItems(user)}
                    align="right"
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary">No users found</p>
        </div>
      )}
    </div>
  );
};

export default UserTable;

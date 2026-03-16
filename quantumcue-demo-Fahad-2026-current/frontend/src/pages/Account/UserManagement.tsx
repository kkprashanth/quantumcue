/**
 * User management page (admin only).
 */

import { useState } from 'react';
import { Users, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { UserTable } from '../../components/account/UserTable';
import { InviteUserModal } from '../../components/account/InviteUserModal';
import { Modal, ModalActions } from '../../components/ui/Modal';
import { useUsers, useDeactivateUser, useUpdateUser } from '../../hooks/useAccount';
import { useAuth } from '../../hooks/useAuth';
import type { UserListItem } from '../../api/endpoints/account';

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { data: usersData, isLoading, error } = useUsers();
  const deactivateUser = useDeactivateUser();
  const updateUser = useUpdateUser();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<UserListItem | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserListItem | null>(null);

  const handleDeactivate = async () => {
    if (!userToDeactivate) return;

    try {
      await deactivateUser.mutateAsync(userToDeactivate.id);
      setUserToDeactivate(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleReactivate = async (user: UserListItem) => {
    try {
      await updateUser.mutateAsync({
        userId: user.id,
        data: { status: 'active' },
      });
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="bg-status-error/10 border border-status-error/20 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-status-error mx-auto mb-4" />
          <h2 className="text-text-primary font-medium text-lg mb-2">
            Unable to Load Users
          </h2>
          <p className="text-text-tertiary">
            {(error as Error).message || 'There was an error loading the user list.'}
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="User Management"
        description={`${usersData?.total || 0} users in your organization`}
        icon={<Users className="w-6 h-6" />}
        action={
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        }
      />

      <UserTable
        users={usersData?.users || []}
        currentUserId={currentUser?.id || ''}
        onEdit={(user) => {
          if (user.status === 'inactive') {
            handleReactivate(user);
          } else {
            setUserToEdit(user);
          }
        }}
        onDeactivate={setUserToDeactivate}
      />

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={!!userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        title="Deactivate User"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-status-error/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-status-error" />
          </div>
          <p className="text-text-secondary mb-2">
            Are you sure you want to deactivate{' '}
            <span className="font-medium text-text-primary">
              {userToDeactivate?.full_name}
            </span>
            ?
          </p>
          <p className="text-text-tertiary text-sm">
            They will no longer be able to access the platform.
          </p>
        </div>

        {deactivateUser.error && (
          <div className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-lg">
            <p className="text-sm text-status-error">
              {(deactivateUser.error as Error).message || 'Failed to deactivate user'}
            </p>
          </div>
        )}

        <ModalActions>
          <Button variant="ghost" onClick={() => setUserToDeactivate(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeactivate}
            disabled={deactivateUser.isPending}
          >
            {deactivateUser.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Deactivating...
              </>
            ) : (
              'Deactivate'
            )}
          </Button>
        </ModalActions>
      </Modal>

      {/* Edit User Modal - Simple for now */}
      <Modal
        isOpen={!!userToEdit}
        onClose={() => setUserToEdit(null)}
        title="Edit User"
        description="User editing coming soon..."
        size="sm"
      >
        <div className="text-center py-8">
          <p className="text-text-tertiary">
            Full user editing functionality will be available in a future update.
          </p>
        </div>
        <ModalActions>
          <Button onClick={() => setUserToEdit(null)}>Close</Button>
        </ModalActions>
      </Modal>
    </PageContainer>
  );
};

export default UserManagement;

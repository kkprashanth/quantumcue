/**
 * Modal for inviting new users.
 */

import { useState } from 'react';
import { Check, Copy, Loader2, AlertCircle } from 'lucide-react';
import { Modal, ModalActions } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCreateUser } from '../../hooks/useAccount';
import type { InviteResponse } from '../../api/endpoints/account';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteUserModal = ({ isOpen, onClose }: InviteUserModalProps) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [result, setResult] = useState<InviteResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const createUser = useCreateUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await createUser.mutateAsync({
        email,
        first_name: firstName,
        last_name: lastName,
        role,
      });
      setResult(response);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCopy = async () => {
    if (result?.temporary_password) {
      await navigator.clipboard.writeText(result.temporary_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setRole('user');
    setResult(null);
    setCopied(false);
    createUser.reset();
    onClose();
  };

  // Success state
  if (result) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="User Created"
        size="md"
      >
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-status-success/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-status-success" />
          </div>
          <h3 className="text-lg font-medium text-grey-900 dark:text-text-primary mb-2">
            {result.user.full_name} has been invited!
          </h3>
          <p className="text-grey-600 dark:text-text-secondary text-sm mb-6">
            Share the temporary password below with the user.
          </p>

          <div className="bg-grey-50 dark:bg-surface-elevated border border-grey-200 dark:border-border rounded-lg p-4 mb-4">
            <p className="text-xs text-grey-500 dark:text-text-tertiary mb-2">Temporary Password</p>
            <div className="flex items-center justify-between gap-3">
              <code className="text-lg font-mono text-grey-900 dark:text-text-primary">
                {result.temporary_password}
              </code>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-grey-100 dark:hover:bg-surface rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success-500" />
                ) : (
                  <Copy className="w-4 h-4 text-grey-500 dark:text-text-tertiary" />
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-grey-500 dark:text-text-tertiary">
            The user should change their password after first login.
          </p>
        </div>

        <ModalActions>
          <Button onClick={handleClose}>Done</Button>
        </ModalActions>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite User"
      description="Add a new user to your account"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {createUser.error && (
          <div className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
            <p className="text-sm text-status-error">
              {(createUser.error as Error).message || 'Failed to create user'}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@company.com"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-600 dark:text-text-secondary mb-2">
              Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`
                  p-3 rounded-lg border text-left transition-colors
                  ${role === 'user'
                    ? 'border-navy-700 bg-navy-50 dark:bg-navy-700/10'
                    : 'border-grey-200 dark:border-border hover:border-grey-300 dark:hover:border-border-subtle'
                  }
                `}
              >
                <p className={`font-medium ${role === 'user' ? 'text-navy-800 dark:text-navy-600' : 'text-grey-900 dark:text-text-primary'}`}>
                  User
                </p>
                <p className="text-xs text-grey-500 dark:text-text-tertiary mt-1">
                  Can view and submit jobs
                </p>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`
                  p-3 rounded-lg border text-left transition-colors
                  ${role === 'admin'
                    ? 'border-navy-700 bg-navy-50 dark:bg-navy-700/10'
                    : 'border-grey-200 dark:border-border hover:border-grey-300 dark:hover:border-border-subtle'
                  }
                `}
              >
                <p className={`font-medium ${role === 'admin' ? 'text-navy-800 dark:text-navy-600' : 'text-grey-900 dark:text-text-primary'}`}>
                  Admin
                </p>
                <p className="text-xs text-grey-500 dark:text-text-tertiary mt-1">
                  Full account access
                </p>
              </button>
            </div>
          </div>
        </div>

        <ModalActions>
          <Button variant="ghost" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createUser.isPending || !email || !firstName || !lastName}
          >
            {createUser.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Inviting...
              </>
            ) : (
              'Invite User'
            )}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
};

export default InviteUserModal;

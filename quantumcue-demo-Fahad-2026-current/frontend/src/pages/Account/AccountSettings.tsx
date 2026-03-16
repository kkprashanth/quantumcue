/**
 * Account settings page (admin only) with new design system.
 */

import { useState } from 'react';
import { Building2, Loader2, Save, AlertCircle, DollarSign, Brain } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAccount, useUpdateAccount, useAccountStats, useAccountUsage } from '../../hooks/useAccount';

export const AccountSettings = () => {
  const { data: account, isLoading: accountLoading } = useAccount();
  const { data: stats } = useAccountStats();
  const { data: usage } = useAccountUsage();
  const updateAccount = useUpdateAccount();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form when account loads
  if (account && !isEditing && name === '' && description === '') {
    setName(account.name);
    setDescription(account.description || '');
  }

  const handleSave = async () => {
    try {
      await updateAccount.mutateAsync({
        name: name || undefined,
        description: description || undefined,
      });
      setIsEditing(false);
    } catch {
      // Error handled by mutation
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatMB = (mb: number) => {
    if (mb === 0) return '0 MB';
    if (mb < 1024) return `${mb.toFixed(0)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens === 0) return '0';
    if (tokens < 1000) return tokens.toLocaleString();
    if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
    return `${(tokens / 1000000).toFixed(2)}M`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  const getTierVariant = (tier: string): 'success' | 'warning' | 'info' | 'quantum' | 'default' => {
    switch (tier) {
      case 'enterprise':
        return 'quantum';
      case 'professional':
        return 'info';
      case 'starter':
        return 'success';
      case 'trial':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (accountLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  if (!account) {
    return (
      <PageContainer>
        <Card className="p-8 text-center border-error/20 bg-error/10">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-grey-900 dark:text-text-primary font-semibold text-lg mb-2">
            Unable to Load Account
          </h2>
          <p className="text-grey-500 dark:text-text-tertiary">
            There was an error loading your account information.
          </p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Account Settings"
        description="Manage your organization settings"
        icon={<Building2 className="w-6 h-6" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-grey-900 dark:text-text-primary">Organization Details</h3>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </div>

            {updateAccount.error && (
              <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error">
                  {(updateAccount.error as Error).message || 'Failed to update account'}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Organization Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                placeholder="Your company name"
              />

              <div>
                <label className="block text-sm font-semibold text-grey-700 dark:text-text-primary mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Brief description of your organization"
                  className="w-full px-4 py-3 bg-white dark:bg-surface border border-grey-200 dark:border-border rounded-lg text-grey-900 dark:text-text-primary placeholder:text-grey-400 dark:placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/20 dark:focus:ring-navy-700/20 focus:border-navy-900 dark:focus:border-navy-700 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-grey-700 dark:text-text-primary mb-2">
                    Account Slug
                  </label>
                  <p className="text-grey-900 dark:text-text-primary font-mono bg-grey-50 dark:bg-surface-elevated px-4 py-3 rounded-lg">
                    {account.slug}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-grey-700 dark:text-text-primary mb-2">
                    Plan
                  </label>
                  <div className="bg-grey-50 dark:bg-surface-elevated px-4 py-3 rounded-lg">
                    <Badge variant={getTierVariant(account.tier)}>
                      {account.tier.charAt(0).toUpperCase() + account.tier.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-grey-200 dark:border-border">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setName(account.name);
                      setDescription(account.description || '');
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={updateAccount.isPending} leftIcon={updateAccount.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
                    {updateAccount.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Data Usage */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-grey-600 dark:text-text-secondary mb-4">Data Usage</h3>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-grey-900 dark:text-text-primary font-semibold">
                  {formatMB(account.data_used_mb || 0)}
                </span>
                <span className="text-grey-500 dark:text-text-tertiary text-sm">
                  of {formatMB(account.data_budget_mb || 102400)}
                </span>
              </div>
              <div className="h-2 bg-grey-200 dark:bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    account.data_usage_percentage > 90
                      ? 'bg-error'
                      : account.data_usage_percentage > 70
                      ? 'bg-warning-500'
                      : 'bg-navy-700'
                  }`}
                  style={{ width: `${Math.min(account.data_usage_percentage || 0, 100)}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-grey-500 dark:text-text-tertiary">
              {(account.data_usage_percentage || 0).toFixed(1)}% used
            </p>
          </Card>

          {/* Execution Time */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-grey-600 dark:text-text-secondary mb-4">Execution Time</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-grey-500 dark:text-text-tertiary text-sm">Total Allotted</span>
                <span className="text-grey-900 dark:text-text-primary font-semibold">
                  {formatTime(account.total_time_allotted_seconds || 3600)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-grey-500 dark:text-text-tertiary text-sm">Time Remaining</span>
                <span className={`font-semibold ${
                  (account.time_remaining_seconds || 0) < (account.total_time_allotted_seconds || 3600) * 0.1
                    ? 'text-error-600 dark:text-error-500'
                    : (account.time_remaining_seconds || 0) < (account.total_time_allotted_seconds || 3600) * 0.3
                    ? 'text-warning-600 dark:text-warning-500'
                    : 'text-success-600 dark:text-success-500'
                }`}>
                  {formatTime(account.time_remaining_seconds || 3600)}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-grey-200 dark:border-border">
              <div className="h-2 bg-grey-200 dark:bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (account.time_remaining_seconds || 0) < (account.total_time_allotted_seconds || 3600) * 0.1
                      ? 'bg-error'
                      : (account.time_remaining_seconds || 0) < (account.total_time_allotted_seconds || 3600) * 0.3
                      ? 'bg-warning-500'
                      : 'bg-success-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, ((account.time_remaining_seconds || 0) / (account.total_time_allotted_seconds || 3600)) * 100)}%` 
                  }}
                />
              </div>
              <p className="text-xs text-grey-500 dark:text-text-tertiary mt-1">
                {((account.time_remaining_seconds || 0) / (account.total_time_allotted_seconds || 3600) * 100).toFixed(1)}% remaining
              </p>
            </div>
          </Card>

          {/* Account Stats */}
          {stats && (
            <Card padding="md">
              <h3 className="text-sm font-semibold text-grey-600 dark:text-text-secondary mb-4">Account Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-grey-500 dark:text-text-tertiary">Total Users</span>
                  <span className="text-grey-900 dark:text-text-primary font-semibold">{stats.total_users}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-grey-500 dark:text-text-tertiary">Active Users</span>
                  <span className="text-grey-900 dark:text-text-primary font-semibold">{stats.active_users}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-grey-500 dark:text-text-tertiary">Total Jobs</span>
                  <span className="text-grey-900 dark:text-text-primary font-semibold">{stats.total_jobs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-grey-500 dark:text-text-tertiary">Completed Jobs</span>
                  <span className="text-success-600 dark:text-success-500 font-semibold">{stats.completed_jobs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-grey-500 dark:text-text-tertiary">Failed Jobs</span>
                  <span className="text-error-600 dark:text-error-500 font-semibold">{stats.failed_jobs}</span>
                </div>
              </div>
            </Card>
          )}

          {/* LLM Usage & Costs */}
          {usage && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-navy-700" />
                <h3 className="text-sm font-semibold text-grey-600 dark:text-text-secondary">LLM Usage & Costs</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-grey-500 dark:text-text-tertiary text-xs">Total Tokens</span>
                    <span className="text-grey-900 dark:text-text-primary font-semibold">{formatTokens(usage.total_tokens)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-grey-500 dark:text-text-tertiary text-xs">Total Cost</span>
                    <span className="text-navy-800 dark:text-navy-600 font-semibold flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(usage.total_cost)}
                    </span>
                  </div>
                </div>
                
                {Object.keys(usage.models_used).length > 0 && (
                  <div className="pt-3 border-t border-grey-200 dark:border-border">
                    <h4 className="text-xs font-semibold text-grey-600 dark:text-text-secondary mb-3">Models Used</h4>
                    <div className="space-y-2">
                      {Object.entries(usage.models_used).map(([model, count]) => {
                        const tokens = usage.tokens_by_model[model] || { total: 0, input: 0, output: 0 };
                        const cost = usage.cost_by_model[model] || 0;
                        return (
                          <div key={model} className="text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-grey-900 dark:text-text-primary font-mono">{model.split('-')[0]}</span>
                              <span className="text-grey-500 dark:text-text-tertiary">{count} calls</span>
                            </div>
                            <div className="flex items-center justify-between text-grey-500 dark:text-text-tertiary">
                              <span>{formatTokens(tokens.total)} tokens</span>
                              <span>{formatCurrency(cost)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Created Date */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-grey-600 dark:text-text-secondary mb-2">Account Created</h3>
            <p className="text-grey-900 dark:text-text-primary">
              {new Date(account.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default AccountSettings;

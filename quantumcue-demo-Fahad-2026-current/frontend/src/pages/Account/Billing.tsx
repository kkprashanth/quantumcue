/**
 * Billing page (admin only) with new design system.
 */

import { CreditCard, Zap, Check } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAccount } from '../../hooks/useAccount';

const plans = [
  {
    name: 'Trial',
    price: 0,
    period: '14 days',
    features: [
      '1GB data storage',
      '2 team members',
      'Basic quantum providers',
      'Community support',
    ],
    current: false,
  },
  {
    name: 'Starter',
    price: 49,
    period: 'per month',
    features: [
      '10GB data storage',
      '5 team members',
      'All quantum providers',
      'Email support',
      'Basic analytics',
    ],
    current: false,
  },
  {
    name: 'Professional',
    price: 199,
    period: 'per month',
    features: [
      '100GB data storage',
      '20 team members',
      'All quantum providers',
      'Priority support',
      'Advanced analytics',
      'API access',
    ],
    current: true,
    popular: true,
  },
  {
    name: 'Enterprise',
    price: null,
    period: 'custom',
    features: [
      'Unlimited storage',
      'Unlimited team members',
      'All quantum providers',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'On-premise option',
    ],
    current: false,
  },
];

export const Billing = () => {
  const { data: account } = useAccount();

  return (
    <PageContainer>
      <PageHeader
        title="Billing & Plans"
        description="Manage your subscription and billing information"
        icon={<CreditCard className="w-6 h-6" />}
      />

      {/* Current Plan Banner */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-navy-50 to-cyan-50 dark:from-navy-700/10 dark:to-cyan-500/10 border-navy-200 dark:border-navy-700/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-grey-500 dark:text-text-tertiary text-sm mb-1">Current Plan</p>
            <h3 className="text-2xl font-bold text-grey-900 dark:text-text-primary">
              {account?.tier?.charAt(0).toUpperCase() + (account?.tier?.slice(1) || '')} Plan
            </h3>
          </div>
          <Zap className="w-12 h-12 text-navy-700" />
        </div>
      </Card>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            variant={plan.popular ? 'elevated' : 'default'}
            className={`relative p-6 ${plan.popular
                ? 'border-navy-700 ring-2 ring-navy-700/20'
                : ''
              }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="quantum">
                  Most Popular
                </Badge>
              </div>
            )}

            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-grey-900 dark:text-text-primary mb-2">{plan.name}</h4>
              <div className="mb-1">
                {plan.price !== null ? (
                  <>
                    <span className="text-3xl font-bold text-grey-900 dark:text-text-primary">${plan.price}</span>
                    <span className="text-grey-500 dark:text-text-tertiary text-sm"> / {plan.period}</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-grey-900 dark:text-text-primary">Custom</span>
                )}
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-grey-600 dark:text-text-secondary">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              variant={plan.current ? 'secondary' : plan.popular ? 'quantum' : 'ghost'}
              className="w-full"
              disabled={plan.current}
            >
              {plan.current ? 'Current Plan' : plan.price === null ? 'Contact Sales' : 'Upgrade'}
            </Button>
          </Card>
        ))}
      </div>

      {/* Billing History */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-grey-900 dark:text-text-primary mb-4">Billing History</h3>
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-grey-400 dark:text-text-tertiary mx-auto mb-3" />
          <p className="text-grey-900 dark:text-text-primary font-semibold mb-2">No billing history yet</p>
          <p className="text-grey-500 dark:text-text-tertiary text-sm">
            Your invoices and payment history will appear here.
          </p>
        </div>
      </Card>

      {/* Demo Notice */}
      {/* <Card className="mt-6 p-4 border-warning-200 dark:border-warning-500/30 bg-warning-50 dark:bg-warning-500/10">
        <p className="text-sm text-warning-700 dark:text-warning-400">
          <strong>Demo Mode:</strong> Billing functionality is simulated. No actual charges will be made.
        </p>
      </Card> */}
    </PageContainer>
  );
};

export default Billing;

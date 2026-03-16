/**
 * Job Wizard Step 2: Problem Type Selection
 */

import { useEffect } from 'react';
import { Target, Brain, Zap, BarChart3, Check } from 'lucide-react';
import { Input } from '../ui/Input';
import type { JobWizardData } from './JobWizard';
import type { JobType } from '../../api/endpoints/jobs';

interface JobWizardStep2ProblemTypeProps {
  data: JobWizardData;
  onUpdate: (updates: Partial<JobWizardData>) => void;
}

const PROBLEM_TYPES: { value: JobType; label: string; description: string; icon: typeof Target }[] = [
  {
    value: 'machine_learning',
    label: 'Quantum Machine Learning',
    description: 'Train quantum neural networks, classifiers, or generative models',
    icon: Brain,
  },
  {
    value: 'optimization',
    label: 'Optimization',
    description: 'Solve combinatorial optimization problems (QUBO, Ising)',
    icon: Zap,
  },
  {
    value: 'simulation',
    label: 'Simulation',
    description: 'Simulate quantum systems and molecular structures',
    icon: BarChart3,
  },
];

export const JobWizardStep2ProblemType = ({ data, onUpdate }: JobWizardStep2ProblemTypeProps) => {
  // Auto-populate description from dataset if available and description is empty
  useEffect(() => {
    if (data.dataset?.description && !data.description) {
      onUpdate({ description: data.dataset.description });
    }
  }, [data.dataset?.description, data.description, onUpdate]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Select Problem Type</h2>
        <p className="text-text-secondary">
          Choose the type of quantum computing problem you want to solve
        </p>
      </div>

      {/* Problem Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PROBLEM_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = data.job_type === type.value;

          return (
            <button
              key={type.value}
              onClick={() => onUpdate({ job_type: type.value })}
              className={`
                relative p-4 rounded-lg border text-left transition-all
                ${isSelected
                  ? 'border-navy-700 bg-navy-50 dark:bg-navy-700/10 ring-2 ring-navy-700 ring-offset-2 ring-offset-white dark:ring-offset-background'
                  : 'border-grey-200 dark:border-border hover:border-navy-700/50 hover:bg-grey-50 dark:hover:bg-surface-elevated'
                }
              `}
            >
              {/* Checkbox indicator */}
              <div
                className={`
                  absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all
                  ${isSelected
                    ? 'bg-navy-700 text-white'
                    : 'border-2 border-grey-300 dark:border-border bg-white dark:bg-surface'
                  }
                `}
              >
                {isSelected && <Check className="w-4 h-4" />}
              </div>

              <div className="pr-8">
                <Icon className={`w-8 h-8 mb-3 flex-shrink-0 ${isSelected ? 'text-accent-primary' : 'text-text-tertiary'}`} />
                <h3 className={`text-lg font-medium mb-1 ${isSelected ? 'text-accent-primary' : 'text-text-primary'}`}>
                  {type.label}
                </h3>
                <p className="text-sm text-text-secondary">{type.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Job Name and Description */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Job Name *
          </label>
          <Input
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g., Alzheimer's Detection QNN"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Description
          </label>
          <textarea
            value={data.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe your quantum computing job..."
            rows={4}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary transition-colors hover:border-border-subtle focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

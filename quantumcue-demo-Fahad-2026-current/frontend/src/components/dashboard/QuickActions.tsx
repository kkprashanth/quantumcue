/**
 * Quick actions component for dashboard with new design system.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Upload, Brain, FolderPlus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { isNewUser } from '@/utils/user';

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  isDeselected?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  title,
  description,
  onClick,
  variant = 'secondary',
  isDeselected = false,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        w-full h-full p-6 rounded-xl border-2 transition-all text-left
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        flex items-start gap-4 hover:-translate-y-[1px]
        ${variant === 'primary'
          ? 'bg-gradient-to-br from-[#1581BF] to-[#007486] border-navy-700 text-white'
          : isDeselected
            ? 'bg-white dark:bg-white border-grey-200 dark:border-border hover:border-navy-300 dark:hover:border-navy-700/50'
            : 'bg-surface border-border hover:border-navy-300 dark:hover:border-navy-700/50'
        }
      `}
    >
      <div
        className={`
          flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center mt-0
          ${variant === 'primary'
            ? 'text-white'
            : 'text-navy-600 dark:text-navy-600'
          }
        `}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className={`
            font-semibold text-lg mb-1
            ${variant === 'primary' ? 'text-white' : 'text-grey-900 dark:text-text-primary'}
          `}
        >
          {title}
        </h3>
        <p
          className={`
            text-sm
            ${variant === 'primary' ? 'text-white/90' : 'text-grey-600 dark:text-text-secondary'}
          `}
        >
          {description.split('\n').map((line, idx) => (
            <React.Fragment key={idx}>
              {line}
              {idx < description.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      </div>
    </button>
  );
};

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userIsNew = isNewUser(user);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const handleMouseEnter = (index: number) => setHoveredIndex(index);
  const handleMouseLeave = () => setHoveredIndex(null);

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
        <QuickActionCard
          icon={<FolderPlus size={24} />}
          title="New Project"
          description="Upload dataset, train model, review"
          onClick={() => navigate(userIsNew ? '/projects/new' : '/datasets/upload?new_project=true')}
          variant={hoveredIndex === null || hoveredIndex === 0 ? 'primary' : 'secondary'}
          isDeselected={hoveredIndex === 1 || hoveredIndex === 2}
          onMouseEnter={() => handleMouseEnter(0)}
          onMouseLeave={handleMouseLeave}
        />
        {/* <QuickActionCard
          icon={<Briefcase size={24} />}
          title="New Job"
          description="Use an existing dataset to train a new model"
          onClick={() => navigate('/jobs/new')}
          variant={hoveredIndex === 1 ? 'primary' : 'secondary'}
          onMouseEnter={() => handleMouseEnter(1)}
          onMouseLeave={handleMouseLeave}
        />
        <QuickActionCard
          icon={<Upload size={24} />}
          title="New Dataset"
          description="Upload a dataset to use for training"
          onClick={() => navigate('/datasets/upload')}
          variant={hoveredIndex === 2 ? 'primary' : 'secondary'}
          onMouseEnter={() => handleMouseEnter(2)}
          onMouseLeave={handleMouseLeave}
        /> */}
      </div>
    </div>
  );
};

export default QuickActions;

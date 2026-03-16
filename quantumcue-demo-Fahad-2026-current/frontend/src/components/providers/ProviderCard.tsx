import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, ArrowRight, Check, ExternalLink } from 'lucide-react';
import { ProviderStatusIndicator } from './ProviderStatusIndicator';
import { ProviderLogo } from './ProviderLogo';
import {
  type ProviderSummary,
  getProviderTypeLabel,
  getProviderTypeColor,
} from '../../api/endpoints/providers';
import { generateProviderPattern } from '../../utils/patternUtils';
import { Card } from '../ui/Card';

interface ProviderCardProps {
  provider: ProviderSummary;
  isSelected?: boolean;
  onSelect?: (providerId: string) => void;
  disabled?: boolean;
  footer?: React.ReactNode;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  isSelected = false,
  onSelect,
  disabled = false,
  footer
}) => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = React.useState(false);

  const pattern = React.useMemo(() => generateProviderPattern(provider.id), [provider.id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <Card
      variant="stat"
      padding="none"
      className={`
        group relative overflow-hidden flex flex-col h-full transition-all duration-300 ease-out 
        ${!disabled && 'hover:-translate-y-1 cursor-pointer'}
        ${isSelected ? 'border-navy-700 ring-2 ring-navy-700 ring-offset-2 dark:ring-offset-background' : 'border-grey-200 dark:border-border'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={() => {
        if (disabled) return;
        if (onSelect) {
          onSelect(provider.id);
        } else if (!footer) {
          navigate(`/providers/${provider.id}`);
        }
      }}
    >
      <div
        className="absolute inset-0 z-0 transition-opacity duration-300 group-hover:opacity-100 opacity-0"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(51, 78, 104, 0.1), transparent 40%)`,
        }}
      />

      <div
        className="absolute inset-0 z-0 transition-opacity duration-500"
        style={{
          background: pattern.background,
          opacity: isHovering ? (pattern.opacity || 0.5) * 1.2 : (pattern.opacity || 0.5),
          backgroundSize: '24px 24px, 100% 100%',
        }}
      />

      <div className="relative z-10 p-5 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-grey-900 dark:text-text-primary leading-tight">
                {provider.name}
              </h3>
              <div className="mb-2">
                <ProviderStatusIndicator status={provider.status} size="sm" showLabel={false} />
              </div>
            </div>
            <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getProviderTypeColor(provider.provider_type)}`}>
              {getProviderTypeLabel(provider.provider_type)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-2">
            {onSelect && (
              <div
                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected
                    ? 'bg-navy-700 border-navy-700 text-white'
                    : 'border-grey-300 dark:border-border bg-white dark:bg-surface'
                  }
                `}
              >
                {isSelected && <Check size={14} />}
              </div>
            )}
            <div className="bg-white/80 dark:bg-surface/80 backdrop-blur-sm w-24 h-24 flex-shrink-0 flex items-center justify-center rounded-lg border border-grey-100 dark:border-border shadow-sm group/logo relative">
              <ProviderLogo code={provider.code} size={80} />
            </div>
          </div>
        </div>

        <div className="mt-0 relative bottom-9">
          <div className="flex items-center gap-2 text-grey-600 dark:text-text-secondary">
            <Cpu size={16} className="text-quantum-500" />
            <span className="text-sm font-medium truncate" title={provider.processor_name || ''}>
              {provider.processor_name || 'Standard Processor'}
            </span>
          </div>
        </div>

        {/* Footer Section */}
        {footer ? (
          <div className="mt-auto relative z-20">
            {footer}
          </div>
        ) : (
          <div
            className="mt-auto pt-3 border-t border-grey-100 dark:border-border flex items-center justify-between group/footer hover:bg-grey-50 dark:hover:bg-surface-elevated -mx-5 px-5 transition-colors cursor-pointer"
            onClick={(e) => {
              if (onSelect) {
                e.stopPropagation();
                window.open(`/providers/${provider.id}`, '_blank');
              }
            }}
          >
            <span className="text-xs font-semibold text-grey-500 dark:text-text-tertiary group-hover/footer:text-navy-700 dark:group-hover/footer:text-navy-400">
              View details and specs
            </span>
            <div className="flex items-center gap-1 text-quantum-600 font-bold text-sm transform transition-transform group-hover/footer:translate-x-1">
              <ArrowRight size={18} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProviderCard;

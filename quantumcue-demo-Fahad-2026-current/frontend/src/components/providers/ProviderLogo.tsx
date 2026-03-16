/**
 * Provider logo component that displays brand SVGs for different quantum computing providers.
 *
 * Logos are served from the public path: `/provider_logos/{code}.svg`.
 */

import React, { useMemo, useState } from 'react';

type ProviderLogoVariant = 'icon' | 'full';

interface ProviderLogoProps {
  code: string;
  /** For `icon`, this controls both width+height. For `full`, this controls height. */
  size?: number;
  variant?: ProviderLogoVariant;
  className?: string;
}

const FALLBACK_BG_CLASS =
  'bg-grey-100 dark:bg-surface-elevated border border-grey-200 dark:border-border';

const normalizeCode = (code: string) => code.trim().toLowerCase();

const getInitials = (code: string) => normalizeCode(code).slice(0, 2).toUpperCase();

export const ProviderLogo: React.FC<ProviderLogoProps> = ({
  code,
  size = 48,
  variant = 'icon',
  className = '',
}) => {
  const normalizedCode = useMemo(() => normalizeCode(code), [code]);
  const [hasError, setHasError] = useState(false);

  const src = `/provider_logos/${normalizedCode}.svg`;
  const alt = `${normalizedCode.toUpperCase()} logo`;

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg ${FALLBACK_BG_CLASS} ${className}`}
        style={{
          width: variant === 'icon' ? size : undefined,
          height: size,
          minWidth: variant === 'icon' ? size : undefined,
        }}
        aria-label={alt}
      >
        <span className="text-grey-700 dark:text-text-secondary font-semibold">
          {getInitials(code)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`object-contain ${className}`}
      style={{
        width: variant === 'icon' ? size : 'auto',
        height: size,
        maxWidth: '100%',
        maxHeight: '100%',
      }}
      loading="lazy"
      decoding="async"
    />
  );
};

export default ProviderLogo;

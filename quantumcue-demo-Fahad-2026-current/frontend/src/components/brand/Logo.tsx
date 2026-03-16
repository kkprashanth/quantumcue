/**
 * QuantumCue Logo component with brand logos.
 */

import React from 'react';

interface LogoProps {
  variant?: 'q' | 'full' | 'full-with-tagline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
}) => {
  const sizeConfig = {
    sm: { width: 200, height: 38 },
    md: { width: 260, height: 49 },
    lg: { width: 300, height: 57 },
    xl: { width: 340, height: 64 },
  };

  const qSizeConfig = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
  };

  const { width, height } = sizeConfig[size];
  const qSize = qSizeConfig[size];

  // Q logo only variant (icon)
  if (variant === 'q') {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src="/quantumcue_icon.svg"
          alt="QuantumCue"
          width={qSize}
          height={qSize}
          className="flex-shrink-0"
        />
      </div>
    );
  }

  // Full logo with text and tagline
  if (variant === 'full-with-tagline') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img
          src="/quantumcue_logo.svg"
          alt="QuantumCue - Quantum connected. AI accelerated.™"
          width={width}
          height={height}
          className="flex-shrink-0 object-contain"
        />
      </div>
    );
  }
  const noTaglineSizeConfig = {
    sm: { width: 140, height: 20 },
    md: { width: 160, height: 23 },
    lg: { width: 180, height: 26 },
    xl: { width: 200, height: 30 },
  };
  const noTaglineSize = noTaglineSizeConfig[size];

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/quantumcue_logo.svg"
        alt="QuantumCue"
        width={noTaglineSize.width}
        height={noTaglineSize.height}
        className="flex-shrink-0 object-contain"
      />
    </div>
  );
};

export default Logo;

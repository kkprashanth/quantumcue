/**
 * Avatar component for displaying user images or initials.
 */

import React from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getColorClass = (name: string): string => {
    const colors = [
      // 'bg-navy-700',
      'bg-quantum-cyan',
      'bg-status-success',
      'bg-status-warning',
      'bg-blue-500',
      'bg-pink-500',
      'bg-orange-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={`
          ${sizeStyles[size]}
          rounded-full
          object-cover
          ${className}
        `}
      />
    );
  }

  if (name) {
    return (
      <div
        className={`
          ${sizeStyles[size]}
          ${getColorClass(name)}
          rounded-full
          flex items-center justify-center
          font-medium text-white
          ${className}
        `}
      >
        {getInitials(name)}
      </div>
    );
  }

  // Default placeholder
  return (
    <div
      className={`
        ${sizeStyles[size]}
        bg-bg-tertiary
        rounded-full
        flex items-center justify-center
        text-text-tertiary
        ${className}
      `}
    >
      <svg
        className="w-1/2 h-1/2"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
};

export default Avatar;

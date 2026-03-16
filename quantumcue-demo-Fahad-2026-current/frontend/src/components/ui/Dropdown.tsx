/**
 * Dropdown menu component.
 */

import React, { useState, useRef, useEffect } from 'react';

interface DropdownItem {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleItemClick = (e: React.MouseEvent, item: DropdownItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center focus:outline-none"
      >
        {trigger}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 w-56
            bg-surface
            border border-border-primary
            rounded-lg shadow-lg
            py-1
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={index}
                  className="my-1 border-t border-border-primary"
                />
              );
            }

            const itemContent = (
              <>
                {item.icon && (
                  <span className="mr-3 flex-shrink-0">{item.icon}</span>
                )}
                <span>{item.label}</span>
              </>
            );

            const itemClasses = `
              w-full px-4 py-2
              flex items-center
              text-sm text-left
              transition-colors
              ${item.danger
                ? 'text-status-error hover:bg-status-error/10'
                : 'text-text-primary hover:bg-bg-tertiary'
              }
            `;

            if (item.href) {
              return (
                <a
                  key={index}
                  href={item.href}
                  className={itemClasses}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                >
                  {itemContent}
                </a>
              );
            }

            return (
              <div
                key={index}
                role="button"
                tabIndex={0}
                className={itemClasses}
                onClick={(e) => handleItemClick(e, item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(e as any, item);
                  }
                }}
              >
                {itemContent}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;

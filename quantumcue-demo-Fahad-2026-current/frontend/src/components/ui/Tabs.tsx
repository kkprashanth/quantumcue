/**
 * Tabs component for content organization.
 */

import { createContext, useContext, useState, ReactNode } from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

interface TabItem {
  id: string;
  label: ReactNode;
}

interface TabsProps {
  defaultValue?: string;
  defaultTab?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  tabs?: TabItem[];
  children: ReactNode | ((activeTab: string) => ReactNode);
  className?: string;
}

export const Tabs = ({
  defaultValue,
  defaultTab,
  value,
  onValueChange,
  tabs,
  children,
  className = '',
}: TabsProps) => {
  const initialValue = defaultValue || defaultTab || (tabs && tabs.length > 0 ? tabs[0].id : '');
  const [internalValue, setInternalValue] = useState(initialValue);

  const activeTab = value !== undefined ? value : internalValue;
  const setActiveTab = (tab: string) => {
    if (value === undefined) {
      setInternalValue(tab);
    }
    onValueChange?.(tab);
  };

  // Support render function pattern with tabs prop
  if (tabs && typeof children === 'function') {
    return (
      <TabsContext.Provider value={{ activeTab, setActiveTab }}>
        <div className={className}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="mt-4">
            {children(activeTab)}
          </div>
        </div>
      </TabsContext.Provider>
    );
  }

  // Standard pattern with TabsList/TabsContent
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children as ReactNode}</div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export const TabsList = ({ children, className = '' }: TabsListProps) => {
  return (
    <div
      className={`
        flex gap-1 p-1 rounded-lg bg-grey-100 dark:bg-surface-elevated
        ${className}
      `}
      role="tablist"
    >
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const TabsTrigger = ({
  value,
  children,
  className = '',
  disabled = false,
}: TabsTriggerProps) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={`
        px-4 py-2 rounded-md text-sm font-medium
        transition-all duration-200
        relative
        ${isActive
          ? 'bg-[#3850A0] text-white font-semibold'
          : 'text-grey-600 dark:text-text-secondary hover:text-grey-900 dark:hover:text-text-primary hover:bg-white/50 dark:hover:bg-surface/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const TabsContent = ({
  value,
  children,
  className = '',
}: TabsContentProps) => {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      className={`mt-4 ${className}`}
    >
      {children}
    </div>
  );
};

export default Tabs;

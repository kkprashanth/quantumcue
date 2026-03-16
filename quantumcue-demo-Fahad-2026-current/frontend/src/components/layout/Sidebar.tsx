import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Settings,
  Users,
  CreditCard,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Brain,
  Database,
  BookOpen,
  Plus,
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { Tooltip } from '../ui/Tooltip';
import { useAuthContext } from '../../contexts/AuthContext';
import { isNewUser } from '../../utils/user';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  adminOnly?: boolean;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user } = useAuthContext();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  // Check if user is new (created today)
  const userIsNew = user ? isNewUser(user) : false;

  // Detect if user is in a wizard
  const isInJobWizard = location.pathname.startsWith('/jobs/new');
  const isInDatasetWizard = location.pathname.startsWith('/datasets/upload');

  // Define wizard sub-steps
  const jobWizardSteps = [
    { id: 1, label: 'Select Dataset', path: '/jobs/new' },
    { id: 2, label: 'Problem Type', path: '/jobs/new' },
    { id: 3, label: 'Data Review', path: '/jobs/new' },
    { id: 4, label: 'Provider', path: '/jobs/new' },
    { id: 5, label: 'Configuration', path: '/jobs/new' },
    { id: 6, label: 'Review', path: '/jobs/new' },
  ];

  const datasetWizardSteps = [
    { id: 1, label: 'Upload Data', path: '/datasets/upload' },
    { id: 2, label: 'Processing', path: '/datasets/upload' },
    { id: 3, label: 'Summary', path: '/datasets/upload' },
  ];

  const mainNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      href: '/dashboard',
    },
    {
      label: 'Datasets',
      icon: <Database size={20} />,
      href: '/datasets',
    },
    {
      label: 'Jobs',
      icon: <Briefcase size={20} />,
      href: '/jobs',
    },
    {
      label: 'Models',
      icon: <Brain size={20} />,
      href: '/models',
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      label: 'Account',
      icon: <Users size={20} />,
      href: '/account',
      adminOnly: true,
    },
    {
      label: 'Billing',
      icon: <CreditCard size={20} />,
      href: '/billing',
      adminOnly: true,
    },
  ];

  const bottomNavItems: NavItem[] = [
    {
      label: 'Settings',
      icon: <Settings size={20} />,
      href: '/settings',
    },
    {
      label: 'Documentation',
      icon: <BookOpen size={20} />,
      href: '/documentation',
    },
    {
      label: 'Help',
      icon: <HelpCircle size={20} />,
      href: '/help',
    },
  ];

  const renderNavItem = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) return null;

    // Check if this item should be highlighted due to wizard context
    const isWizardParent =
      (item.href === '/jobs' && isInJobWizard) ||
      (item.href === '/datasets' && isInDatasetWizard);

    const isActive = location.pathname === item.href ||
      (item.href !== '/dashboard' && location.pathname.startsWith(item.href)) ||
      isWizardParent;

    const linkContent = (
      <NavLink
        to={item.href}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg
          transition-colors
          ${isActive || isWizardParent
            ? 'bg-navy-100 dark:bg-navy-700/20 text-navy-700 dark:text-navy-600 font-semibold'
            : 'text-grey-600 dark:text-text-secondary hover:text-grey-900 dark:hover:text-text-primary hover:bg-grey-100 dark:hover:bg-surface-elevated'
          }
          ${isCollapsed ? 'justify-center' : ''}
        `}
        aria-label={isCollapsed ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
        {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.href} content={item.label} position="right">
          {linkContent}
        </Tooltip>
      );
    }

    // Render sub-steps if in wizard and this is the parent item
    const subSteps = isWizardParent && !isCollapsed
      ? (item.href === '/jobs' ? jobWizardSteps : datasetWizardSteps)
      : null;

    const currentUrlStep = parseInt(new URLSearchParams(location.search).get('step') || '1', 10);

    return (
      <div key={item.href}>
        {linkContent}
        {subSteps && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-navy-200 dark:border-navy-700/30 pl-3">
            {subSteps.map((step) => {
              const isCurrentStep = currentUrlStep === step.id;
              return (
                <div
                  key={step.id}
                  className={`
                    text-xs py-1 px-2 rounded transition-colors
                    ${isCurrentStep
                      ? 'bg-navy-50 dark:bg-navy-900/40 text-navy-700 dark:text-navy-400 font-bold'
                      : (isInJobWizard || isInDatasetWizard
                        ? 'text-navy-600/70 dark:text-navy-600/50 hover:text-navy-700 dark:hover:text-navy-400'
                        : 'text-text-tertiary'
                      )
                    }
                  `}
                >
                  {step.id}. {step.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full
        bg-white dark:bg-surface
        border-r border-grey-200 dark:border-border
        flex flex-col
        transition-all duration-300
        z-40
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-grey-200 dark:border-border ${isCollapsed ? 'justify-center' : ''}`}>
        {isCollapsed ? (
          <Logo variant="q" size="md" />
        ) : (
          <Logo variant="full" size="md" />
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {mainNavItems.map(renderNavItem)}

        {isAdmin && (
          <>
            {!isCollapsed && (
              <div className="pt-4 pb-2">
                <span className="px-3 text-xs font-semibold text-grey-400 dark:text-text-tertiary uppercase tracking-wider">
                  Admin
                </span>
              </div>
            )}
            {isCollapsed && <div className="py-2 border-t border-grey-200 dark:border-border" />}
            {adminNavItems.map(renderNavItem)}
          </>
        )}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 space-y-1 border-t border-grey-200 dark:border-border">
        {bottomNavItems.map(renderNavItem)}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className={`
          absolute top-20 -right-3
          w-6 h-6
          bg-white dark:bg-surface
          border border-grey-200 dark:border-border
          rounded-full
          flex items-center justify-center
          text-grey-600 dark:text-text-secondary
          hover:text-grey-900 dark:hover:text-text-primary
          hover:bg-grey-100 dark:hover:bg-surface-elevated
          transition-colors
          z-50
          shadow-sm
        `}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
};

export default Sidebar;

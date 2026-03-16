import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Settings, LogOut, Sun, Moon, Plus, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Switch } from '../ui/Switch';
import { Avatar } from '../ui/Avatar';
import { Dropdown } from '../ui/Dropdown';
import { Button } from '../ui/Button';
import { useAuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, account, logout } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const location = useLocation();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isAdminPanel = location.pathname.startsWith('/admin');

  const handleAdminToggle = () => {
    React.startTransition(() => {
      if (isAdminPanel) {
        navigate('/dashboard');
      } else {
        navigate('/admin/users');
      }
    });
  };

  const userMenuItems = isAdmin
    ? [
      {
        label: (
          <div className="flex items-center justify-between w-full min-w-[120px]">
            <span className="font-medium mr-2">{isAdminPanel ? 'Admin Mode' : 'User Mode'}</span>
            <Switch checked={isAdminPanel} className="pointer-events-none" />
          </div>
        ),
        icon: <Settings size={16} />,
        onClick: handleAdminToggle,
      },
      { divider: true, label: '' },
      {
        label: 'Sign out',
        icon: <LogOut size={16} />,
        onClick: handleLogout,
        danger: true,
      },
    ]
    : [
      {
        label: 'Profile',
        icon: <User size={16} />,
        onClick: () => React.startTransition(() => navigate('/profile')),
      },
      {
        label: 'Settings',
        icon: <Settings size={16} />,
        onClick: () => React.startTransition(() => navigate('/settings')),
      },
      { divider: true, label: '' },
      {
        label: 'Sign out',
        icon: <LogOut size={16} />,
        onClick: handleLogout,
        danger: true,
      },
    ];

  const userName = user ? `${user.first_name} ${user.last_name}` : '';

  return (
    <header className="sticky top-0 z-[100] h-16 bg-white/95 dark:bg-surface/95 backdrop-blur-sm border-b border-grey-200 dark:border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-xl font-semibold text-grey-900 dark:text-text-primary mr-4">{title}</h1>
        )}
        <Button
          variant='luxury'
          size="sm"
          onClick={() => navigate('/projects/new')}
          leftIcon={<Plus size={16} />}
          className="shadow-md hover:scale-105 transition-all duration-300 font-bold tracking-wide"
        >
          New Project
        </Button>
      </div>

      <div className="flex items-center gap-6">
        {/* <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="p-2"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button> */}

        {account && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-grey-100 dark:bg-surface-elevated rounded-lg">
            <span className="text-xs text-grey-500 dark:text-text-tertiary">Account:</span>
            <span className="text-sm text-grey-700 dark:text-text-secondary font-medium">
              {account.name}
            </span>
            {/* <span className={`
              text-xs px-1.5 py-0.5 rounded
              ${account.tier === 'enterprise' ? 'bg-navy-100 dark:bg-navy-700/20 text-navy-800 dark:text-navy-600' :
                account.tier === 'professional' ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400' :
                  'bg-grey-200 dark:bg-grey-800 text-grey-600 dark:text-grey-300'}
            `}>
              {account.tier}
            </span> */}
          </div>
        )}

        <Dropdown
          className="z-[999]"
          trigger={
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="relative">
                <Avatar name={userName} size="sm" className="bg-[#3850A0]" />
                {user?.role?.toLowerCase() === 'superadmin' && (
                  <div className="absolute -bottom-1 -right-1 bg-red-500 text-white p-0.5 rounded-full ring-2 ring-white dark:ring-surface">
                    <ShieldAlert size={10} strokeWidth={3} />
                  </div>
                )}
                {user?.role?.toLowerCase() === 'admin' && (
                  <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white p-0.5 rounded-full ring-2 ring-white dark:ring-surface">
                    <ShieldCheck size={10} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-grey-900 dark:text-text-primary">{userName}</p>
              </div>
            </div>
          }

          items={userMenuItems}
          align="right"
        />
      </div>
    </header>
  );
};

export default Header;

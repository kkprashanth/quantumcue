import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Activity,
    BarChart2,
    ChevronLeft,
    ChevronRight,
    Key,
    LayoutDashboard,
    Lock,
    LogOut,
    Menu,
    Settings,
    Users
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { Tooltip } from '../ui/Tooltip';
import { useAuthContext } from '../../contexts/AuthContext';

interface AdminSidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, onToggle }) => {
    const { logout } = useAuthContext();
    const location = useLocation();

    const navItems = [
        {
            label: 'User Management',
            icon: <Users size={20} />,
            href: '/admin/users',
        },
        {
            label: 'Access Codes',
            icon: <Key size={20} />,
            href: '/admin/codes',
        },
        {
            label: 'Login Activity',
            icon: <Activity size={20} />,
            href: '/admin/activity',
        },
        {
            label: 'Hardware/Software Parameters',
            icon: <Settings size={20} />,
            href: '/admin/providers',
        },
        // {
        //     label: 'Logout Activity',
        //     icon: <LogOut size={20} />,
        //     href: '/admin/logout-activity',
        // },
    ];

    return (
        <aside
            className={`
                fixed left-0 top-0 h-full
                bg-white border-r border-gray-200
                flex flex-col
                transition-all duration-300 ease-in-out
                z-40
                ${isCollapsed ? 'w-20' : 'w-72'}
                shadow-xl shadow-gray-200/50
            `}
        >
            <div className={`h-20 flex items-center px-6 border-b border-gray-100 ${isCollapsed ? 'justify-center px-0' : ''}`}>
                {isCollapsed ? (
                    <div className="flex items-center gap-3">
                        <img src="/quantumcue_icon.svg" width={150} height={150} />
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <img src="/quantumcue_logo.svg" width={150} height={150} />
                    </div>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {!isCollapsed && (
                    <div className="px-2 mb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Main Menu</span>
                    </div>
                )}

                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.href);

                    const linkContent = (
                        <NavLink
                            to={item.href}
                            className={`
                                flex items-center gap-3 px-3 py-3 rounded-xl
                                transition-all duration-200 group relative
                                ${isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }
                                ${isCollapsed ? 'justify-center' : ''}
                            `}
                        >
                            {isActive && !isCollapsed && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                            )}

                            <span className={`flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {React.cloneElement(item.icon as React.ReactElement, {
                                    size: 22,
                                    strokeWidth: isActive ? 2.5 : 2
                                })}
                            </span>

                            {!isCollapsed && (
                                <span className="text-sm font-medium tracking-wide">{item.label}</span>
                            )}

                            {!isCollapsed && isActive && (
                                <ChevronRight className="ml-auto w-4 h-4 text-blue-400" />
                            )}
                        </NavLink>
                    );

                    if (isCollapsed) {
                        return (
                            <Tooltip key={item.href} content={item.label} position="right">
                                {linkContent}
                            </Tooltip>
                        );
                    }

                    return <div key={item.href}>{linkContent}</div>;
                })}
            </nav>

            <div className="p-4 border-t border-gray-100 space-y-1 bg-gray-50/50">
                <NavLink
                    to="/dashboard"
                    className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm
                        transition-all duration-200
                        ${isCollapsed ? 'justify-center' : ''}
                    `}
                >
                    <LayoutDashboard size={20} />
                    {!isCollapsed && <span className="text-sm font-medium">Back to App</span>}
                </NavLink>

                <button
                    onClick={logout}
                    className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-gray-500 hover:text-red-600 hover:bg-red-50 hover:shadow-sm
                        transition-all duration-200 group
                        ${isCollapsed ? 'justify-center' : ''}
                    `}
                >
                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                    {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
                </button>
            </div>

            <button
                onClick={onToggle}
                className={`
                    absolute top-24 -right-3
                    w-6 h-6
                    bg-white border border-gray-200
                    rounded-full
                    flex items-center justify-center
                    text-gray-400 hover:text-blue-600 hover:border-blue-200
                    transition-all duration-200
                    z-50
                    shadow-sm
                `}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </aside>
    );
};

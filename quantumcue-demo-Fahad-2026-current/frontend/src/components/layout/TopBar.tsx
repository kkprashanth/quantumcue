import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { Button } from '../ui/Button';
import { useTheme } from '../../contexts/ThemeContext';

export const TopBar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { label: 'Login', href: '/login' },
        { label: 'Sign Up', href: '/signup' },
    ];

    const ThemeToggle = () => (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                <Moon className="w-5 h-5 text-grey-600 dark:text-text-secondary" />
            ) : (
                <Sun className="w-5 h-5 text-grey-600 dark:text-text-secondary" />
            )}
        </Button>
    );

    return (
        <>
            <div className="h-16 bg-white dark:bg-surface border-b border-grey-200 dark:border-border flex items-center justify-between px-4 sm:px-6 fixed top-0 left-0 right-0 z-50">
                {/* Logo */}
                <div className="flex items-center">
                    <Logo variant="full" size="sm" />
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6">
                    <nav className="flex items-center gap-6">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.href}
                                to={item.href}
                                className={({ isActive }) => `
                  text-sm font-medium transition-colors
                  ${isActive
                                        ? 'text-navy-700 dark:text-navy-400'
                                        : 'text-grey-600 dark:text-text-secondary hover:text-navy-700 dark:hover:text-text-primary'
                                    }
                `}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="h-6 w-px bg-grey-200 dark:bg-border" />
                    <ThemeToggle />
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex items-center gap-2 md:hidden">
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? (
                            <X className="w-6 h-6 text-grey-600 dark:text-text-secondary" />
                        ) : (
                            <Menu className="w-6 h-6 text-grey-600 dark:text-text-secondary" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Sidebar */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Sidebar Content */}
                    <div className="absolute right-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-surface border-l border-grey-200 dark:border-border shadow-xl transform transition-transform duration-200 ease-in-out">
                        <nav className="flex flex-col p-4 space-y-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={({ isActive }) => `
                    flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                                            ? 'bg-navy-50 dark:bg-navy-900/20 text-navy-700 dark:text-navy-400'
                                            : 'text-grey-600 dark:text-text-secondary hover:bg-grey-50 dark:hover:bg-surface-elevated hover:text-navy-700 dark:hover:text-text-primary'
                                        }
                  `}
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </div>
            )}

            {/* Spacer to prevent content from being hidden behind fixed TopBar */}
            <div className="h-16" />
        </>
    );
};

/**
 * Main application layout with sidebar and header.
 */

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

import { FloatingModelAssistant } from '../models/FloatingModelAssistant';

interface MainLayoutProps {
  pageTitle?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ pageTitle }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="min-h-screen bg-grey-50 dark:bg-background quantum-grid-bg">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div
        className={`
          transition-all duration-300
          ${sidebarCollapsed ? 'ml-16' : 'ml-64'}
        `}
      >
        {/* Header */}
        <Header title={pageTitle} />

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>

        {/* Global Floating Assistant */}
        <FloatingModelAssistant />
      </div>
    </div>
  );
};

export default MainLayout;

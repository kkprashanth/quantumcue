/**
 * Documentation page with new design system.
 */

import {
  BookOpen,
  FileText,
  Code,
  Zap,
  Database,
  LineChart,
  ChevronRight,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

interface DocSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: string[];
}

const DocSection = ({ icon, title, description, items }: DocSectionProps) => (
  <Card variant="elevated" className="p-6">
    <div className="flex items-start gap-4 mb-4">
      <div className="p-3 bg-navy-100 dark:bg-navy-700/20 rounded-lg text-navy-800 dark:text-navy-600">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-grey-900 dark:text-text-primary mb-1">{title}</h3>
        <p className="text-grey-500 dark:text-text-secondary text-sm">{description}</p>
      </div>
    </div>
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-center gap-2 text-grey-600 dark:text-text-secondary hover:text-grey-900 dark:hover:text-text-primary transition-colors cursor-pointer group">
          <ChevronRight className="w-4 h-4 text-grey-400 dark:text-text-tertiary group-hover:text-navy-700 transition-colors" />
          <span className="text-sm">{item}</span>
        </li>
      ))}
    </ul>
  </Card>
);

export const Documentation = () => {
  const sections = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Getting Started',
      description: 'Learn the basics and set up your first quantum job',
      items: [
        'Introduction to QuantumCue',
        'Creating Your First Job',
        'Understanding Job Types',
        'Quick Start Tutorial',
      ],
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: 'API Reference',
      description: 'Complete API documentation for developers',
      items: [
        'Authentication',
        'Job Management API',
        'Provider API',
        'Webhooks & Events',
      ],
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'Data Management',
      description: 'Working with datasets and data formats',
      items: [
        'Supported File Formats',
        'Data Transformation',
        'Data Validation',
        'Storage Limits',
      ],
    },
    {
      icon: <LineChart className="w-6 h-6" />,
      title: 'Problem Formulation',
      description: 'How to formulate problems for quantum computing',
      items: [
        'QUBO Formulation',
        'Ising Models',
        'Optimization Problems',
        'Constraint Handling',
      ],
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Guides & Tutorials',
      description: 'Step-by-step guides for common tasks',
      items: [
        'Portfolio Optimization',
        'Route Optimization',
        'Machine Learning',
        'Quantum Chemistry',
      ],
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Best Practices',
      description: 'Tips and recommendations for optimal results',
      items: [
        'Choosing the Right Provider',
        'Optimizing Job Performance',
        'Cost Management',
        'Troubleshooting',
      ],
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Documentation"
        description="Complete guides and reference materials"
        icon={<BookOpen className="w-6 h-6" />}
      />

      {/* Documentation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, index) => (
          <DocSection key={index} {...section} />
        ))}
      </div>

      {/* Quick Links */}
      <Card className="mt-8 p-6 bg-gradient-to-r from-navy-50 to-cyan-50 dark:from-navy-700/10 dark:to-cyan-500/10 border-navy-200 dark:border-navy-700/30">
        <h3 className="text-lg font-semibold text-grey-900 dark:text-text-primary mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="#"
            className="flex items-center gap-2 text-grey-600 dark:text-text-secondary hover:text-navy-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">API Documentation</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 text-grey-600 dark:text-text-secondary hover:text-navy-700 transition-colors"
          >
            <Code className="w-4 h-4" />
            <span className="text-sm font-medium">Code Examples</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 text-grey-600 dark:text-text-secondary hover:text-navy-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Full Documentation Site</span>
          </a>
        </div>
      </Card>

      {/* Demo Notice */}
      {/* <Card className="mt-6 p-4 border-warning-200 dark:border-warning-500/30 bg-warning-50 dark:bg-warning-500/10">
        <p className="text-sm text-warning-700 dark:text-warning-400">
          <strong>Demo Mode:</strong> This is a demonstration environment. Documentation links are simulated.
        </p>
      </Card> */}
    </PageContainer>
  );
};

export default Documentation;

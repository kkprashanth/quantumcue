/**
 * Help page with documentation and support resources with new design system.
 */

import {
  HelpCircle,
  BookOpen,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronRight,
  Zap,
  Code,
  Database,
  LineChart,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface GuideCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
}

const GuideCard = ({ icon, title, description, link }: GuideCardProps) => (
  <Card variant="elevated" className="p-6 cursor-pointer group">
    <div className="flex items-start gap-4">
      <div className="p-3 bg-navy-100 dark:bg-navy-700/20 rounded-lg text-navy-800 dark:text-navy-600">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-grey-900 dark:text-text-primary font-semibold group-hover:text-navy-800 dark:group-hover:text-navy-600 transition-colors">
          {title}
        </h3>
        <p className="text-grey-500 dark:text-text-tertiary text-sm mt-1">{description}</p>
      </div>
      {link && (
        <ChevronRight className="w-5 h-5 text-grey-400 dark:text-text-tertiary group-hover:text-navy-700 transition-colors" />
      )}
    </div>
  </Card>
);

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem = ({ question, answer }: FAQItemProps) => (
  <details className="group border-b border-grey-200 dark:border-border last:border-0">
    <summary className="flex items-center justify-between py-4 cursor-pointer list-none">
      <h4 className="text-grey-900 dark:text-text-primary font-semibold pr-4">{question}</h4>
      <ChevronRight className="w-5 h-5 text-grey-400 dark:text-text-tertiary transition-transform group-open:rotate-90" />
    </summary>
    <p className="text-grey-600 dark:text-text-secondary text-sm pb-4 pr-8">{answer}</p>
  </details>
);

export const Help = () => {
  const guides = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Getting Started',
      description: 'Learn the basics of creating and submitting quantum jobs',
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: 'Problem Formulation',
      description: 'How to formulate optimization problems for quantum computing',
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'Provider Integration',
      description: 'Connect and configure quantum hardware providers',
    },
    {
      icon: <LineChart className="w-6 h-6" />,
      title: 'Understanding Results',
      description: 'Interpret and analyze quantum computation results',
    },
  ];

  const faqs = [
    {
      question: 'What types of problems can I solve with QuantumCue?',
      answer:
        'QuantumCue supports optimization problems (combinatorial, QUBO), quantum simulations, quantum machine learning tasks, and quantum chemistry calculations. Our AI assistant helps you formulate your problem for the appropriate quantum approach.',
    },
    {
      question: 'How do I choose the right quantum provider?',
      answer:
        'Each provider has different strengths. D-Wave excels at optimization problems, IonQ and IBM Quantum are great for gate-based algorithms, and QCI Dirac offers unique annealing capabilities. Our system can recommend the best provider based on your problem type.',
    },
    {
      question: 'What file formats are supported for input data?',
      answer:
        'We support CSV, JSON, and structured text formats. For optimization problems, you can also define constraints and objectives directly through our chat interface.',
    },
    {
      question: 'How is pricing calculated?',
      answer:
        'Pricing varies by provider and job complexity. You can see estimated costs before submitting a job. Most providers charge based on shot count, qubit usage, and execution time.',
    },
    {
      question: 'Can I cancel a running job?',
      answer:
        'Yes, you can cancel jobs that are queued or running. Depending on the provider, you may still be charged for partial execution time.',
    },
    {
      question: 'How do I interpret quantum results?',
      answer:
        'Results include visualizations like energy histograms and measurement distributions. Our AI assistant can also explain results in plain language and help identify optimal solutions.',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Help & Documentation"
        description="Learn how to use QuantumCue effectively"
        icon={<HelpCircle className="w-6 h-6" />}
      />

      {/* Quick Start Banner */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-navy-50 to-cyan-50 dark:from-navy-700/10 dark:to-cyan-500/10 border-navy-200 dark:border-navy-700/30">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-grey-900 dark:text-text-primary mb-2">
              New to Quantum Computing?
            </h2>
            <p className="text-grey-600 dark:text-text-secondary">
              Start with our interactive tutorial to learn the basics and submit your first job.
            </p>
          </div>
          <Button variant="quantum" rightIcon={<ChevronRight className="w-4 h-4" />}>
            Start Tutorial
          </Button>
        </div>
      </Card>

      {/* Guides Grid */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-grey-900 dark:text-text-primary mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-navy-700" />
          Guides & Tutorials
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guides.map((guide, index) => (
            <GuideCard key={index} {...guide} link="#" />
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-grey-900 dark:text-text-primary mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-navy-700" />
          Frequently Asked Questions
        </h2>
        <Card padding="md">
          {faqs.map((faq, index) => (
            <FAQItem key={index} {...faq} />
          ))}
        </Card>
      </section>

      {/* Contact Support */}
      <section>
        <h2 className="text-lg font-semibold text-grey-900 dark:text-text-primary mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-navy-700" />
          Contact Support
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="md" className="text-center">
            <MessageCircle className="w-8 h-8 text-navy-700 mx-auto mb-3" />
            <h3 className="text-grey-900 dark:text-text-primary font-semibold mb-1">Live Chat</h3>
            <p className="text-grey-500 dark:text-text-tertiary text-sm mb-3">
              Get instant help from our team
            </p>
            <Button variant="ghost" size="sm">
              Start Chat
            </Button>
          </Card>
          <Card padding="md" className="text-center">
            <Mail className="w-8 h-8 text-navy-700 mx-auto mb-3" />
            <h3 className="text-grey-900 dark:text-text-primary font-semibold mb-1">Email Support</h3>
            <p className="text-grey-500 dark:text-text-tertiary text-sm mb-3">
              We'll respond within 24 hours
            </p>
            <a
              href="mailto:support@quantumcue.com"
              className="text-navy-700 hover:text-navy-800 dark:text-navy-600 transition-colors text-sm font-medium"
            >
              support@quantumcue.com
            </a>
          </Card>
          <Card padding="md" className="text-center">
            <ExternalLink className="w-8 h-8 text-navy-700 mx-auto mb-3" />
            <h3 className="text-grey-900 dark:text-text-primary font-semibold mb-1">Documentation</h3>
            <p className="text-grey-500 dark:text-text-tertiary text-sm mb-3">
              Browse our full documentation
            </p>
            <a href="#" className="text-navy-700 hover:text-navy-800 dark:text-navy-600 transition-colors text-sm font-medium">
              docs.quantumcue.com
            </a>
          </Card>
        </div>
      </section>

      {/* Demo Notice */}
      {/* <Card className="mt-8 p-4 border-warning-200 dark:border-warning-500/30 bg-warning-50 dark:bg-warning-500/10">
        <p className="text-sm text-warning-700 dark:text-warning-400">
          <strong>Demo Mode:</strong> This is a demonstration environment. Links and support channels are simulated.
        </p>
      </Card> */}
    </PageContainer>
  );
};

export default Help;

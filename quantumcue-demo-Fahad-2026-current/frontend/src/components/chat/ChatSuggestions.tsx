/**
 * Chat suggestions component for quick actions.
 */

import { Sparkles, Cpu, Beaker, BarChart2, Code } from 'lucide-react';

interface Suggestion {
  icon: React.ReactNode;
  text: string;
  prompt: string;
}

const suggestions: Suggestion[] = [
  {
    icon: <Sparkles className="w-4 h-4" />,
    text: 'Optimize a scheduling problem',
    prompt: 'I have a scheduling problem where I need to assign workers to shifts while minimizing conflicts and overtime. Can you help me set up a quantum optimization job?',
  },
  {
    icon: <Beaker className="w-4 h-4" />,
    text: 'Simulate a molecule',
    prompt: 'I want to simulate the electronic structure of a small molecule for drug discovery research. What quantum computing approach would you recommend?',
  },
  {
    icon: <BarChart2 className="w-4 h-4" />,
    text: 'Portfolio optimization',
    prompt: 'I need to optimize an investment portfolio with 20 assets to maximize returns while minimizing risk. How can quantum computing help?',
  },
  {
    icon: <Cpu className="w-4 h-4" />,
    text: 'Run a custom circuit',
    prompt: 'I have a custom quantum circuit I\'d like to run. What providers support custom QASM input and what parameters should I consider?',
  },
  {
    icon: <Code className="w-4 h-4" />,
    text: 'Compare providers',
    prompt: 'Can you explain the differences between the quantum computing providers available? I want to understand which one would be best for my use case.',
  },
];

interface ChatSuggestionsProps {
  onSelect: (prompt: string) => void;
}

export const ChatSuggestions = ({ onSelect }: ChatSuggestionsProps) => {
  return (
    <div className="p-4">
      <p className="text-grey-600 dark:text-text-secondary text-sm mb-3">
        Not sure where to start? Try one of these:
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion.prompt)}
            className="
              inline-flex items-center gap-2 px-3 py-2
              bg-grey-100 dark:bg-surface-elevated text-grey-600 dark:text-text-secondary
              rounded-lg text-sm
              hover:bg-navy-700/20 hover:text-navy-700
              transition-colors
            "
          >
            {suggestion.icon}
            {suggestion.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatSuggestions;

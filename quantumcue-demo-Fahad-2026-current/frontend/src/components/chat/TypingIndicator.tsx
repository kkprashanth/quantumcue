/**
 * Typing indicator component for chat.
 */

import { Sparkles, Loader2 } from 'lucide-react';

export const TypingIndicator = () => {
  return (
    <div className="flex items-start gap-3 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-navy-700/20 flex items-center justify-center mt-1">
        <Sparkles className="w-4 h-4 text-navy-700" />
      </div>
      <div className="bg-white dark:bg-surface border border-grey-200 dark:border-border rounded-xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-navy-700" />
          <span className="text-sm text-grey-500 dark:text-text-tertiary">AI is thinking...</span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;

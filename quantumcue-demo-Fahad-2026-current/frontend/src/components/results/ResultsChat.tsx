/**
 * Results chat component for AI-assisted analysis.
 */

import { useState } from 'react';
import { Send, Loader2, Sparkles, Lightbulb, ArrowRight } from 'lucide-react';
import { chatWithResults, type ResultChatResponse } from '../../api/endpoints/results';

interface ResultsChatProps {
  jobId: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  insights?: string[];
  recommendations?: string[];
}

const SUGGESTED_QUESTIONS = [
  "What do these results mean?",
  "Is this a good result?",
  "What could I do to improve the outcome?",
  "Explain the energy values in the samples",
  "What are the limitations of this result?",
];

export const ResultsChat = ({ jobId }: ResultsChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response: ResultChatResponse = await chatWithResults(jobId, content);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        insights: response.insights,
        recommendations: response.recommendations,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error analyzing the results. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className="bg-grey-50 dark:bg-background rounded-xl border border-grey-200 dark:border-border flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-4 border-b border-grey-200 dark:border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-navy-700" />
          <h3 className="font-medium text-grey-900 dark:text-text-primary">Results Assistant</h3>
        </div>
        <p className="text-grey-500 dark:text-text-tertiary text-sm mt-1">
          Ask questions about your results or get recommendations
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="w-10 h-10 text-navy-700/50 mx-auto mb-4" />
            <p className="text-grey-600 dark:text-text-secondary mb-4">
              I can help you understand your results. Try asking:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((question, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(question)}
                  className="text-sm px-3 py-1.5 rounded-full bg-grey-100 dark:bg-surface-elevated text-grey-600 dark:text-text-secondary hover:bg-navy-700/20 hover:text-navy-700 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-navy-700/20 flex items-center justify-center mt-1">
                  <Sparkles className="w-4 h-4 text-navy-700" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 bg-white dark:bg-surface border-2 ${
                  message.role === 'user'
                    ? 'rounded-tr-sm border-grey-300 dark:border-border'
                    : 'rounded-tl-sm border-grey-300 dark:border-border'
                } text-grey-900 dark:text-text-primary`}
              >
                {message.role === 'user' && (
                  <div className="text-xs font-medium mb-1.5 text-grey-700 dark:text-text-secondary">You</div>
                )}
                {message.role === 'assistant' && (
                  <div className="text-xs font-medium mb-1.5 text-grey-700 dark:text-text-secondary flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Assistant
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed text-grey-900 dark:text-text-primary">{message.content}</p>

                {/* Insights */}
                {message.insights && message.insights.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-grey-200 dark:border-border">
                    <p className="text-xs font-medium mb-2 flex items-center gap-1 text-grey-900 dark:text-text-primary">
                      <Lightbulb className="w-3 h-3" />
                      Key Insights
                    </p>
                    <ul className="text-sm space-y-1">
                      {message.insights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-navy-700">•</span>
                          <span className="text-grey-700 dark:text-text-secondary">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-grey-200 dark:border-border">
                    <p className="text-xs font-medium mb-2 flex items-center gap-1 text-grey-900 dark:text-text-primary">
                      <ArrowRight className="w-3 h-3" />
                      Recommendations
                    </p>
                    <ul className="text-sm space-y-1">
                      {message.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-success-500">→</span>
                          <span className="text-grey-700 dark:text-text-secondary">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-grey-100 dark:bg-surface-elevated border-2 border-grey-300 dark:border-border flex items-center justify-center mt-1">
                  <span className="text-grey-700 dark:text-text-secondary text-xs font-medium">You</span>
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
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
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-grey-200 dark:border-border bg-grey-50 dark:bg-background">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your results..."
            rows={1}
            className="flex-1 resize-none bg-white dark:bg-surface border border-grey-200 dark:border-border rounded-lg px-4 py-3 text-grey-900 dark:text-text-primary placeholder:text-grey-400 dark:placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-navy-700 text-white hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsChat;

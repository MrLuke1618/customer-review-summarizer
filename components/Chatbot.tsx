import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SparklesIcon, SendIcon, CloseIcon, MagicWandIcon } from './Icons';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  title?: string;
  onGenerateQuestions: () => Promise<string[]>;
  isGeneratingQuestions: boolean;
}

const TEMPLATE_QUESTIONS = [
    "What are the biggest complaints?",
    "Summarize the positive feedback in three bullet points.",
    "Are there any comments about the price or value?",
    "What features are mentioned most often, both good and bad?",
];

const SuggestionButton: React.FC<{ question: string; onClick: (q: string) => void; }> = ({ question, onClick }) => (
    <button
        onClick={() => onClick(question)}
        className="w-full text-left p-3 text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 rounded-lg transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
    >
        {question}
    </button>
);

const SuggestionArea: React.FC<{ onSendMessage: (m: string) => void; onGenerateQuestions: () => Promise<string[]>; isGeneratingQuestions: boolean; }> = ({ onSendMessage, onGenerateQuestions, isGeneratingQuestions }) => {
    const [aiQuestions, setAiQuestions] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setError(null);
        try {
            const questions = await onGenerateQuestions();
            setAiQuestions(questions);
        } catch (e: any) {
            setError("Sorry, I couldn't generate questions right now.");
        }
    };

    return (
        <div className="p-4 h-full flex flex-col justify-center text-center">
            <SparklesIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Start the conversation</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Ask anything about your data, or try one of these suggestions.</p>

            <div className="space-y-3 text-left max-w-md mx-auto w-full">
                {aiQuestions.length > 0 ? (
                    aiQuestions.map((q, i) => <SuggestionButton key={`ai-${i}`} question={q} onClick={onSendMessage} />)
                ) : (
                    TEMPLATE_QUESTIONS.map((q, i) => <SuggestionButton key={`template-${i}`} question={q} onClick={onSendMessage} />)
                )}

                <div className="pt-2">
                    <button
                        onClick={handleGenerate}
                        disabled={isGeneratingQuestions}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400"
                    >
                        {isGeneratingQuestions ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                           <MagicWandIcon className="w-5 h-5 mr-2" />
                        )}
                        {isGeneratingQuestions ? 'Generating...' : 'Suggest questions with AI'}
                    </button>
                    {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, messages, onSendMessage, isLoading, title, onGenerateQuestions, isGeneratingQuestions }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="chatbot-modal-title"
        className="w-full max-w-2xl h-[80vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col"
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2 min-w-0">
            <SparklesIcon className="w-6 h-6 text-purple-500 flex-shrink-0" />
            <h2 id="chatbot-modal-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
              {title || 'Ask About Your Data'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Close chat">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <SuggestionArea 
                onSendMessage={onSendMessage}
                onGenerateQuestions={onGenerateQuestions}
                isGeneratingQuestions={isGeneratingQuestions}
            />
          ) : (
            <div className="p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-purple-500 text-white rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="max-w-md p-3 rounded-2xl bg-slate-200 dark:bg-slate-700 rounded-bl-none">
                            <div className="flex items-center justify-center space-x-1">
                                <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
          )}
        </main>
        
        <footer className="p-4 border-t border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <label htmlFor="chat-input" className="sr-only">Chat message</label>
            <input
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., What are the main complaints about battery life?"
              className="flex-1 block w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition sm:text-sm"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 bg-purple-500 text-white rounded-lg shadow-sm hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400"
              aria-label="Send message"
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};
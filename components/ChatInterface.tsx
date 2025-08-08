
import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import type { ChatMessage } from '../types';
import { Send, Bot, User, MessageSquarePlus, Sparkles } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

const BlinkingCursor = () => (
  <span className="inline-block w-2 h-5 bg-sky-400 animate-pulse ml-1" />
);

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
    }
  }

  return (
    <div className="bg-gray-800/30 p-4 md:p-6 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm animate-fade-in mt-8">
        <h3 className="text-xl font-semibold mb-2 flex items-center">
            <MessageSquarePlus className="w-6 h-6 ml-2 text-sky-400" />
            چت تکمیلی
        </h3>
        <p className="text-xs text-gray-500 mb-4">
            این یک چت تعاملی است. می‌توانید سوالات تکمیلی در مورد تحلیل انجام شده بپرسید.
        </p>
        
        <div className="bg-gray-900/40 rounded-lg border border-gray-700/50 h-[500px] flex flex-col p-4">
            <div className="flex-grow overflow-y-auto space-y-6 pr-2">
                {messages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    const isLastMessage = index === messages.length - 1;
                    const textContent = msg.parts[0]?.text || '';
                    
                    return (
                        <div key={msg.timestamp} className={`flex items-end gap-3 animate-slide-in-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`} style={{ animationDelay: `${index * 50}ms` }}>
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isUser ? 'bg-gradient-to-br from-sky-500 to-blue-600' : 'bg-gradient-to-br from-gray-600 to-gray-700'}`}>
                                {isUser ? <User size={20} className="text-white" /> : <Sparkles size={20} className="text-white" />}
                            </div>
                            <div className={`w-auto max-w-lg p-3 rounded-2xl text-sm leading-relaxed shadow-md ${isUser ? 'bg-sky-800/80 text-sky-100 rounded-br-none' : 'bg-gray-700/80 text-gray-200 rounded-bl-none'}`}>
                                <p className="whitespace-pre-wrap">{textContent}{!isUser && isLoading && isLastMessage && <BlinkingCursor />}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 flex items-center gap-3 border-t border-gray-700 pt-4">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="سوال خود را بپرسید..."
                    disabled={isLoading}
                    rows={1}
                    className="flex-grow bg-gray-800/80 border border-gray-600 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none transition disabled:opacity-50"
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="flex-shrink-0 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800/50 disabled:cursor-not-allowed text-white font-bold p-3 rounded-full transition-all transform hover:scale-110 shadow-lg"
                    aria-label="ارسال پیام"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    </div>
  );
};
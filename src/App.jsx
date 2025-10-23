import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, Menu, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function FaskerAI() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! I\'m FaskerAI. How can I help you today?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize API key from environment variables
  useEffect(() => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey) {
      setApiKey(envKey);
    } else {
      console.warn('VITE_GEMINI_API_KEY not found in environment variables');
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    if (!apiKey) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: 'Error: API key not configured. Please check your .env file.',
        sender: 'bot'
      }]);
      return;
    }

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: input }] }]
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `API request failed with status ${response.status}`);
      }

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const botReply = data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: botReply,
          sender: 'bot'
        }]);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('API Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: `Sorry, I encountered an error: ${error.message}`,
        sender: 'bot'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ id: 1, text: 'Hello! I\'m FaskerAI. How can I help you today?', sender: 'bot' }]);
    setSidebarOpen(false);
  };

  // Custom components for ReactMarkdown to match our styling
  const MarkdownComponents = {
    p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
    h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-3 text-white">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold mt-4 mb-3 text-white">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-3 text-white">{children}</h3>,
    h4: ({ children }) => <h4 className="text-base font-bold mt-4 mb-3 text-white">{children}</h4>,
    ul: ({ children }) => <ul className="mb-3 pl-4 list-disc list-outside space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="mb-3 pl-4 list-decimal list-outside space-y-1">{children}</ol>,
    li: ({ children }) => <li className="pl-1">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-400 pl-4 py-1 my-3 italic bg-slate-600/30 rounded-r">
        {children}
      </blockquote>
    ),
    code: ({ inline, children }) => {
      if (inline) {
        return <code className="bg-slate-600 px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
      }
      return (
        <pre className="bg-slate-600 p-3 rounded-lg my-3 overflow-x-auto">
          <code className="text-sm font-mono block">{children}</code>
        </pre>
      );
    },
    a: ({ href, children }) => (
      <a 
        href={href} 
        className="text-blue-300 hover:text-blue-200 underline transition-colors"
        target="_blank" 
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-slate-950 border-r border-slate-700 flex flex-col overflow-hidden`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white">FaskerAI</h1>
        </div>
        <div className="flex-1 px-4 py-6">
          <button
            onClick={clearChat}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
          >
            New Chat
          </button>
        </div>
        <div className="px-4 py-4 border-t border-slate-700">
          <p className="text-slate-400 text-xs">API Status: {apiKey ? '✓ Connected' : '✗ Not configured'}</p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-300 hover:text-white lg:hidden"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              FaskerAI
            </h2>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-2xl px-4 py-3 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none'
                    : 'bg-slate-700 text-slate-100 rounded-bl-none'
                }`}
              >
                {msg.sender === 'user' ? (
                  <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                ) : (
                  <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:mt-4 prose-headings:mb-3 prose-p:my-2 first:prose-p:mt-0 last:prose-p:mb-0">
                    <ReactMarkdown components={MarkdownComponents}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 text-slate-100 px-4 py-3 rounded-lg rounded-bl-none flex items-center gap-2">
                <Loader size={20} className="animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-slate-800 border-t border-slate-700 px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center gap-2"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-slate-400 text-xs mt-2 text-center">
            You can use markdown in your messages. The bot will respond with formatted text.
          </p>
        </div>
      </div>
    </div>
  );
}
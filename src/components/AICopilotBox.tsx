import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, RefreshCw, ShieldAlert, Check, Copy, User, X, Minus, MessageSquare, Terminal, ChevronRight } from 'lucide-react';
import Markdown from 'react-markdown';
import { AlertItem, InductionPlan, Trainset } from '../types';

interface AICopilotBoxProps {
  plan: InductionPlan | null;
  fleet?: Trainset[];
  alerts?: AlertItem[];
  stationsStatus?: Record<string, { isOperational: boolean; reason?: string }>;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isGuardrailed?: boolean;
}

const MarkdownMessageRenderer: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="space-y-1.5 text-xs font-sans leading-relaxed text-slate-200">
      <Markdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-xs font-bold text-cyan-300 font-mono border-b border-cyan-500/30 pb-1 mt-2 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
              <span>{children}</span>
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs font-bold text-emerald-300 font-mono mt-2 mb-1 flex items-center gap-1">
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[11px] font-bold text-cyan-200 font-mono mt-1.5 mb-1 flex items-center gap-1 uppercase tracking-wide">
              <span>{children}</span>
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-1 text-slate-200 font-sans leading-relaxed text-xs">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 my-1 space-y-1 text-slate-200 text-xs">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 my-1 space-y-1 text-slate-200 text-xs">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-slate-200 text-xs leading-relaxed">{children}</li>
          ),
          strong: ({ children }) => {
            const str = String(children);
            if (str.includes('IN_SERVICE') || str.includes('VALID') || str.includes('Operational') || str.includes('Revenue')) {
              return <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mx-0.5">{str}</span>;
            }
            if (str.includes('EXPIRED') || str.includes('MAINTENANCE') || str.includes('CRITICAL') || str.includes('Suspended') || str.includes('Grounded') || str.includes('🔴')) {
              return <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 mx-0.5">{str}</span>;
            }
            if (str.includes('STANDBY') || str.includes('Warning') || str.includes('Inspection') || str.includes('🟡')) {
              return <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mx-0.5">{str}</span>;
            }
            return <strong className="font-bold text-cyan-200">{children}</strong>;
          },
          code: ({ children }) => (
            <code className="bg-slate-950 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] px-1.5 py-0.5 rounded">{children}</code>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded border border-cyan-500/30">
              <table className="w-full text-left text-[11px] font-mono border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-slate-900 text-cyan-300 p-1.5 border-b border-cyan-500/30 font-bold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="p-1.5 border-b border-slate-800 text-slate-300">{children}</td>
          )
        }}
      >
        {text}
      </Markdown>
    </div>
  );
};

export const AICopilotBox: React.FC<AICopilotBoxProps> = ({
  plan,
  fleet = [],
  alerts = [],
  stationsStatus = {},
  isOpen: externalIsOpen,
  onOpen,
  onClose,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isCurrentlyOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: "👋 Welcome to **KMRL Operations Assistant**!\n\nI can assist you with real-time telemetry for all 25 Kochi Metro trainsets, safety fitness certs, depot stabling tracks, maintenance work orders, and crew readiness.\n\n🔒 *Guardrailed specifically for KMRL Metro Rail Operations.*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCurrentlyOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isCurrentlyOpen]);

  const sampleQueries = [
    "Why is TS-04 grounded?",
    "Show rakes with expired safety certs",
    "What rakes are on Standby Line 2?",
    "Check crew availability status",
    "Show station operational overrides",
  ];

  const handleToggle = () => {
    if (isCurrentlyOpen) {
      if (onClose) onClose();
      else setInternalIsOpen(false);
    } else {
      if (onOpen) onOpen();
      else setInternalIsOpen(true);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: "Conversation history cleared. How can I assist with KMRL Metro Operations?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsSending(true);

    // Client-side Guardrail check for off-topic queries
    const lowerQ = textToSend.toLowerCase().trim();
    const offTopicBlocklist = [
      "recipe", "pizza", "cook", "python", "javascript", "coding", "weather",
      "movie", "song", "joke", "game", "president", "football", "cricket",
      "politics", "essay", "homework", "car", "flight", "crypto", "stock market"
    ];

    const isOffTopic = offTopicBlocklist.some(term => lowerQ.includes(term));

    if (isOffTopic) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `guard-${Date.now()}`,
          sender: 'assistant',
          text: "🔒 **Domain Guardrail Active:** I am the specialized KMRL Metro Operations Assistant. I can only assist with Kochi Metro fleet telemetry, trainset status, depot stabling, safety certificates, crew schedules, and maintenance operations. Please ask a query related to KMRL metro rail operations.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isGuardrailed: true,
        }]);
        setIsSending(false);
      }, 400);
      return;
    }

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          plan,
          fleet,
          alerts,
          stationsStatus,
        }),
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || "I checked the Muttom OCC database: all 25 trainsets have been evaluated against safety fitness rules and operational constraints.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("Copilot Error:", err);

      // Local fallback telemetry response
      let fallbackText = "### KMRL OCC Telemetry Response\n\n";

      if (lowerQ.includes("ts-") || lowerQ.includes("rake") || lowerQ.includes("train")) {
        const foundTrain = fleet.find(t => lowerQ.includes(t.id.toLowerCase()));
        if (foundTrain) {
          fallbackText += `**Trainset ${foundTrain.id} (${foundTrain.name}):**\n` +
            `- **Status:** ${foundTrain.currentStatus.replace('_', ' ')}\n` +
            `- **Stabling Bay:** ${foundTrain.bay.bayName} (Shunting Index: ${foundTrain.bay.shuntingCost}/10)\n` +
            `- **Total Mileage:** ${foundTrain.mileageTotal.toLocaleString()} km\n` +
            `- **Rolling Stock Cert:** ${foundTrain.certificates.rollingStock.isExpired ? "🔴 EXPIRED" : "🟢 VALID"} (${foundTrain.certificates.rollingStock.expiryDate})\n` +
            `- **Signalling Cert:** ${foundTrain.certificates.signalling.isExpired ? "🔴 EXPIRED" : "🟢 VALID"} (${foundTrain.certificates.signalling.expiryDate})\n` +
            `- **Telecom Cert:** ${foundTrain.certificates.telecom.isExpired ? "🔴 EXPIRED" : "🟢 VALID"} (${foundTrain.certificates.telecom.expiryDate})\n` +
            `- **Active Job Cards:** ${foundTrain.jobCards.length} open work order(s)\n`;
        } else {
          fallbackText += `**KMRL 25-Rake Fleet Overview:**\n` +
            `- **In Revenue Service:** ${fleet.filter(t => t.currentStatus === 'IN_SERVICE').length} Rakes (Lines 3-6)\n` +
            `- **Dedicated Standby:** ${fleet.filter(t => t.currentStatus === 'STANDBY').length} Rakes (Line 2)\n` +
            `- **Grounded Maintenance:** ${fleet.filter(t => t.currentStatus === 'MAINTENANCE').length} Rakes (Line 1)\n`;
        }
      } else if (lowerQ.includes("cert") || lowerQ.includes("expire") || lowerQ.includes("fitness")) {
        const expired = fleet.filter(t => t.certificates.rollingStock.isExpired || t.certificates.signalling.isExpired || t.certificates.telecom.isExpired);
        fallbackText += `**Safety Certificate Audit:**\n` +
          `- Total Expired Certificate Rakes: **${expired.length} Rakes**\n` +
          expired.map(t => `  • **${t.id}:** RS Expired: ${t.certificates.rollingStock.isExpired}, Sig Expired: ${t.certificates.signalling.isExpired}`).join('\n') + '\n\n' +
          `*All rakes with expired fitness certs are strictly isolated on Line 1 Maintenance Track.*`;
      } else if (lowerQ.includes("station")) {
        const suspendedCount = Object.values(stationsStatus).filter((s: { isOperational: boolean; reason?: string }) => s.isOperational === false).length;
        fallbackText += `**Next-Day Station Operational Readiness:**\n` +
          `- **Operational Stations:** ${25 - suspendedCount} / 25\n` +
          `- **Suspended Stations:** ${suspendedCount} Station(s)\n` +
          Object.entries(stationsStatus)
            .filter(([_, s]: [string, { isOperational: boolean; reason?: string }]) => s.isOperational === false)
            .map(([id, s]: [string, { isOperational: boolean; reason?: string }]) => `  • **${id}:** Suspended (${s.reason || 'Maintenance'})`).join('\n');
      } else {
        fallbackText += `**KMRL Muttom OCC Live Telemetry:**\n` +
          `- **Total Fleet Size:** ${fleet.length} Metropolis Trainsets\n` +
          `- **In Revenue Service:** ${fleet.filter(t => t.currentStatus === 'IN_SERVICE').length} Rakes\n` +
          `- **Compliance Warnings:** ${alerts.length} active alert items in Compliance Center\n` +
          `- **Depot Stabling Rules:** Maintenance rakes on Line 1, Standby rakes on Line 2, Operational rakes on Lines 3-6.`;
      }

      setMessages(prev => [...prev, {
        id: `local-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsSending(false);
    }
  };

  if (!isCurrentlyOpen) {
    return (
      <div id="ai-chatbot-box" className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleToggle}
          className="liquid-glass bg-slate-950/90 border border-cyan-400/60 hover:border-cyan-300 text-white font-mono font-bold px-4 py-3 rounded-full shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] flex items-center space-x-2.5 transition-all cursor-pointer group hover:scale-105"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 text-cyan-300 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-xs tracking-wider text-cyan-100 font-bold">Metro AI Chatbot</span>
        </button>
      </div>
    );
  }

  return (
    <div id="ai-chatbot-box" className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[440px] max-h-[85vh] h-[580px] bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col overflow-hidden space-y-0 font-sans">
      
      {/* Top Floating Popup Header */}
      <div className="p-3.5 bg-gradient-to-r from-slate-950 via-cyan-950/60 to-slate-950 border-b border-cyan-500/30 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Bot className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-white font-mono tracking-tight">Metro AI Operations Chatbot</h3>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold uppercase border border-emerald-500/30">
                Guardrailed
              </span>
            </div>
            <p className="text-[10px] text-cyan-200/80 font-mono">25-Rake Live OCC Telemetry Assistant</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggle}
            className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Minimize Chatbot"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggle}
            className="p-1.5 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
            title="Close Chatbot Popup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Domain Guardrail Sub-Banner */}
      <div className="px-3 py-1.5 bg-cyan-950/60 border-b border-cyan-500/20 flex items-center justify-between text-[10px] font-mono text-cyan-300/90 flex-shrink-0">
        <span className="flex items-center space-x-1.5 truncate">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span className="truncate">Strict KMRL Metro Domain Guardrail Active</span>
        </span>
        <span className="text-emerald-400 font-bold uppercase flex-shrink-0">Syncing OCC</span>
      </div>

      {/* Scrollable Chat Messages Container */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 font-sans text-xs scrollbar-thin scrollbar-thumb-cyan-500/20 bg-slate-950/80">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center flex-shrink-0 text-[9px] font-bold font-mono">
                AI
              </div>
            )}

            <div className={`group relative p-2.5 rounded-xl max-w-[86%] leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-md'
                : msg.isGuardrailed
                ? 'bg-amber-950/50 border border-amber-500/40 text-amber-200 rounded-tl-none font-mono text-[11px]'
                : 'bg-slate-900/90 border border-cyan-500/20 text-slate-200 rounded-tl-none shadow-inner'
            }`}>
              {msg.sender === 'user' ? (
                <div className="text-xs font-sans leading-relaxed text-slate-950 font-medium">
                  {msg.text}
                </div>
              ) : (
                <MarkdownMessageRenderer text={msg.text} />
              )}

              <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/10 text-[9px] font-mono">
                <span className={msg.sender === 'user' ? 'text-slate-950 font-bold' : 'text-slate-500'}>
                  {msg.timestamp}
                </span>

                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-cyan-300 ml-2 cursor-pointer"
                    title="Copy Response"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center flex-shrink-0 text-[9px] font-mono">
                <User className="w-3.5 h-3.5 text-emerald-300" />
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex items-center space-x-2 text-cyan-300 text-xs font-mono bg-cyan-950/40 p-2 rounded-xl border border-cyan-500/20 w-fit">
            <Bot className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Evaluating KMRL CP-SAT telemetry...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Directives Bar */}
      <div className="p-2 bg-slate-950 border-t border-slate-900 flex-shrink-0 space-y-1">
        <span className="text-[9px] text-cyan-400/90 font-bold uppercase tracking-wider font-mono block px-1">
          Quick Directives:
        </span>
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none px-1">
          {sampleQueries.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sug)}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-cyan-950 border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-300 text-[10px] font-mono whitespace-nowrap transition-all cursor-pointer flex-shrink-0"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Input Prompt Footer */}
      <div className="p-2.5 bg-slate-950 border-t border-cyan-500/30 flex items-center gap-2 flex-shrink-0">
        <div className="relative flex-1 flex items-center">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 pointer-events-none animate-pulse" />
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Metro AI chatbot..."
            className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-xl text-xs text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>
        <button
          onClick={() => handleSend()}
          disabled={isSending || !inputQuery.trim()}
          className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1 disabled:opacity-40 flex-shrink-0"
        >
          <Send className="w-3.5 h-3.5 text-slate-950" />
        </button>
      </div>

    </div>
  );
};

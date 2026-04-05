"use client";

import React, { useState, useRef, useEffect } from "react";
import responseData from "../data/chatbotResponses.json";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  time: string;
};

const QUICK_ACTIONS = [
  { label: "How to export?", text: "How do I export my resume to PDF or LaTeX?" },
  { label: "Change template", text: "How do I change my current resume template?" },
  { label: "ATS Guidelines", text: "Are these templates ATS friendly?" },
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: "Hi there! 👋 I'm Aura. How can I help you build your resume today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, time: timeStr };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    setTimeout(() => {
      let botReply = responseData.fallback;
      const query = text.toLowerCase();
      
      for (const intent of responseData.intents) {
        const regex = new RegExp(intent.pattern, "i");
        if (regex.test(query)) {
          botReply = intent.response;
          break;
        }
      }

      setMessages((prev) => [
        ...prev,
        { 
            id: (Date.now() + 1).toString(), 
            role: "bot", 
            content: botReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
      setIsLoading(false);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage(inputValue);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.9) translateY(4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        
        .animate-float-bot { animation: float 6s ease-in-out infinite; }
        .animate-slide-up { animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pop-in { animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; opacity: 0; }
        
        /* COMPLETE GLASS EFFECT */
        .chat-container-glass {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(36px);
            -webkit-backdrop-filter: blur(36px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            box-shadow: 0 16px 40px rgba(0,0,0,0.1);
        }

        [data-theme="dark"] .chat-container-glass {
            background: rgba(10, 10, 10, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 16px 40px rgba(0,0,0,0.4);
        }

        .chat-header-glass {
            background: color-mix(in srgb, var(--accent) 35%, transparent);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        [data-theme="dark"] .chat-header-glass {
            background: color-mix(in srgb, var(--accent) 25%, transparent);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .chat-bot-bubble-glass {
            background: rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            color: var(--foreground);
            box-shadow: 0 4px 15px rgba(0,0,0,0.03);
            border-radius: 20px;
            border-bottom-left-radius: 4px;
        }

        [data-theme="dark"] .chat-bot-bubble-glass {
            background: rgba(30, 30, 30, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .chat-user-bubble-glass {
            background: color-mix(in srgb, var(--accent) 65%, transparent);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            box-shadow: 0 4px 20px var(--glow);
            border-radius: 20px;
            border-bottom-right-radius: 4px;
        }

        [data-theme="dark"] .chat-user-bubble-glass {
            background: color-mix(in srgb, var(--accent) 45%, transparent);
            border: 1px solid rgba(255,255,255,0.15);
        }

        .quick-action-glass {
            background: rgba(255, 255, 255, 0.3) !important;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.5) !important;
            color: var(--foreground);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        [data-theme="dark"] .quick-action-glass {
            background: rgba(30, 30, 30, 0.4) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .quick-action-glass:hover {
            border-color: var(--accent) !important;
            background: color-mix(in srgb, var(--accent) 15%, transparent) !important;
            box-shadow: 0 4px 15px var(--glow);
            transform: translateY(-2px);
            color: var(--accent);
        }

        .chat-input-glass {
            background: rgba(255, 255, 255, 0.4) !important;
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.6) !important;
            color: var(--foreground);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
            transition: all 0.3s ease;
        }

        [data-theme="dark"] .chat-input-glass {
            background: rgba(30, 30, 30, 0.5) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .chat-input-glass:focus {
            outline: none;
            border-color: var(--accent) !important;
            background: rgba(255, 255, 255, 0.7) !important;
        }

        [data-theme="dark"] .chat-input-glass:focus {
            background: rgba(10, 10, 10, 0.8) !important;
        }

        .send-btn-glass {
            background: color-mix(in srgb, var(--accent) 80%, transparent) !important;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            box-shadow: 0 4px 15px var(--glow);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .send-btn-glass:hover:not(:disabled) {
            transform: scale(1.05);
            box-shadow: 0 6px 20px var(--glow);
            background: var(--accent) !important;
        }

        .send-btn-glass:active:not(:disabled) {
            transform: scale(0.95);
        }
      `}} />

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
        {/* Dynamic Chat Window */}
        <div 
          className={`mb-5 w-[90vw] sm:w-[380px] rounded-[28px] overflow-hidden flex flex-col transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom-right chat-container-glass ${
            isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'
          }`}
          style={{ height: isOpen ? '480px' : '0px', maxHeight: '75vh' }}
        >
          {/* Creative Header */}
          <div className="relative p-5 overflow-hidden border-b shrink-0 chat-header-glass text-white" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="relative z-10 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.1)] relative">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-md">
                    <path d="M12 22C12 22 12 14.5 19.5 12C12 9.5 12 2 12 2C12 2 12 9.5 4.5 12C12 14.5 12 22 12 22Z" fill="url(#aura-gradient)"/>
                    <defs>
                      <linearGradient id="aura-gradient" x1="4.5" y1="2" x2="19.5" y2="22" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white" stopOpacity="1"/>
                        <stop offset="1" stopColor="white" stopOpacity="0.6"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute bottom-0 right-[-2px] w-3 h-3 bg-[#34d399] border-2 border-[color:var(--accent)] rounded-full shadow-sm"></div>
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight text-[16px] drop-shadow-sm flex items-center gap-2">
                    Aura
                  </h3>
                  <p className="text-[11px] text-white/90 font-medium tracking-wide mt-0.5 flex items-center gap-1.5 opacity-90">
                    Active Intelligence
                  </p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 active:scale-95 transition-all duration-200"
                aria-label="Close Chat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5 custom-scrollbar relative" style={{ background: 'transparent' }}>
            <div className="text-center mb-1">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-sm">Today</span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full animate-slide-up ${msg.role === "user" ? "justify-end" : "justify-start"} flex-col gap-1`}
              >
                <div
                  className={`relative px-4 py-3 text-[14px] leading-relaxed max-w-[85%] ${
                    msg.role === "user" ? "chat-user-bubble-glass self-end" : "chat-bot-bubble-glass self-start "
                  }`}
                >
                  {msg.content}
                </div>
                <div className={`text-[9px] text-[color:var(--text-muted)] font-medium px-2 ${msg.role === "user" ? "self-end text-right" : "self-start text-left"}`}>
                    {msg.time} {msg.role === "user" && "✓"}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="self-start max-w-[85%] px-4 py-3 chat-bot-bubble-glass animate-slide-up flex flex-col gap-2">
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ background: "var(--text-muted)" }}></span>
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ background: "var(--text-muted)" }}></span>
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)" }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Quick Actions Area */}
          <div className="p-4 border-t shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' }}>
            {messages.length < 3 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {QUICK_ACTIONS.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(action.text)}
                    className="animate-pop-in text-[11px] font-semibold px-3.5 py-2 rounded-[12px] quick-action-glass flex items-center gap-1.5 shadow-sm"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
            
            <div className="relative z-10">
              <input
                type="text"
                placeholder="Message Aura..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full text-[14px] font-medium py-3 pl-4 pr-[50px] rounded-[18px] chat-input-glass"
              />
              <button
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square flex items-center justify-center rounded-[14px] send-btn-glass disabled:opacity-0 disabled:scale-75 disabled:pointer-events-none"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Floating Magic Launcher */}
        <button
          onClick={toggleChat}
          className={`group animate-float-bot relative flex items-center justify-center z-50 w-[60px] h-[60px] text-white rounded-full transition-all duration-500 hover:scale-[1.08] active:scale-[0.92] focus:outline-none ${isOpen ? 'scale-75 rotate-90 brightness-75 drop-shadow-none' : ''}`}
          style={{ 
            background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 90%, transparent), color-mix(in srgb, var(--accent-dark) 90%, transparent))",
            backdropFilter: "blur(12px)",
            boxShadow: "0 10px 40px -10px var(--glow), inset 0 2px 0 rgba(255,255,255,0.2)",
            animation: isOpen ? 'none' : 'float 6s ease-in-out infinite' 
          }}
          aria-label="Toggle AI Assistant"
        >
          {!isOpen && (
            <div className="absolute inset-[-8px] rounded-full border border-[color:var(--accent)] opacity-30 animate-ping [animation-duration:3s]"></div>
          )}
          
          <div className="relative z-10 flex items-center justify-center transform transition-transform duration-500">
            {isOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="-rotate-90">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ dropShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                <path d="M12 8v4" strokeLinecap="round"></path>
                <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"></circle>
              </svg>
            )}
          </div>
        </button>
      </div>
    </>
  );
}

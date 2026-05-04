"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  ChevronRight,
  MessageSquare,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { aiService } from "@/services/ai.service";
import { useLanguage } from "@/providers/LanguageProvider";

interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
  timestamp: Date;
}

interface AICopilotProps {
  user: any;
  internship?: any;
}

export function AICopilot({ user, internship }: AICopilotProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      text: t.nexo.greeting.replace("{name}", user?.fullName?.split(" ")[0] || "User"),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiService.isAvailable().then(setAiAvailable).catch(() => setAiAvailable(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Construir contexto para la IA
      const context = `
        ${t.nexo.context.student}: ${user?.fullName}
        ${t.nexo.context.internship}: ${internship?.company?.name || t.nexo.context.none}
        ${t.nexo.context.status}: ${internship?.status || "N/A"}
        ${t.nexo.context.docs}: ${internship?.documents?.length || 0}
        ${t.nexo.context.hours}: ${internship?.totalHours || 0}
      `;

      const answer = await aiService.askQuestion(userMsg.text, context);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: t.nexo.error,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = t.nexo.suggestions;

  return (
    <>
      {/* Botón Flotante */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#003366] text-[#C5A059] rounded-full shadow-2xl flex items-center justify-center z-50 group border border-blue-900/30 overflow-hidden"
        data-tour="dashboard-ai-copilot"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
      </motion.button>

      {/* Ventana de Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-28 right-8 w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,51,102,0.3)] border border-slate-100 flex flex-col z-50 overflow-hidden"
          >
            {/* Header del Copilot */}
            <div className="bg-[#003366] p-6 text-white relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#C5A059] rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
                  <Bot className="w-6 h-6 text-[#003366]" />
                </div>
                <div>
                  <h4 className="text-lg font-black tracking-tight">Nexo AI</h4>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      aiAvailable === null ? "bg-slate-400 animate-pulse" :
                      aiAvailable ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                    )} />
                    <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">
                      {aiAvailable === null ? t.nexo.connecting : aiAvailable ? t.nexo.online : t.nexo.offline}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mensajes */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    msg.role === "user" ? "bg-[#C5A059]/10 text-[#C5A059]" : "bg-[#003366]/5 text-[#003366]"
                  )}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-[13px] font-medium leading-relaxed max-w-[80%]",
                    msg.role === "user" 
                      ? "bg-[#C5A059] text-white rounded-tr-none shadow-md shadow-amber-900/10" 
                      : "bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm"
                  )}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#003366]/5 text-[#003366] flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                  </div>
                </div>
              )}
            </div>

            {/* Sugerencias */}
            {messages.length === 1 && (
              <div className="px-6 pb-2 pt-4 bg-slate-50/50 space-y-2">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <HelpCircle className="w-3 h-3" /> {t.nexo.faq}
                 </p>
                 <div className="flex flex-wrap gap-2">
                   {suggestions.map((s) => (
                     <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-600 hover:border-[#C5A059] hover:text-[#C5A059] transition-all"
                     >
                       {s}
                     </button>
                   ))}
                 </div>
              </div>
            )}

            {/* Input */}
            <div className="p-6 bg-white border-t border-slate-100">
               <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl focus-within:border-[#003366] transition-all">
                  <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isTyping && aiAvailable && handleSend()}
                    placeholder={aiAvailable === false ? t.nexo.unavailable : t.nexo.placeholder}
                    disabled={!aiAvailable || isTyping}
                    className="flex-1 bg-transparent border-none outline-none px-3 text-sm font-medium text-slate-700 disabled:text-slate-400"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!aiAvailable || isTyping}
                    className="w-10 h-10 bg-[#003366] text-white rounded-xl flex items-center justify-center hover:bg-[#004488] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, Minimize2, Maximize2, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Scenario } from '@/types';

interface AgentChatProps {
    scenario: Scenario;
}

interface Message {
    id: string;
    sender: 'user' | 'agent';
    text: string;
    type?: 'insight' | 'alert' | 'text';
    timestamp: Date;
}

export default function AgentChat({ scenario }: AgentChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'agent',
            text: `Hello. I am the Consensus Coordinator. I'm analyzing the "${scenario.title}" scenario. Ask me about risks, budget allocation, or trade-offs.`,
            type: 'text',
            timestamp: new Date()
        }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        // User Message
        const userMsg: Message = {
            id: crypto.randomUUID(),
            sender: 'user',
            text: input,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Simulate AI Response (Rule-based for demo)
        setTimeout(() => {
            const responseText = generateResponse(input, scenario);
            const agentMsg: Message = {
                id: crypto.randomUUID(),
                sender: 'agent',
                text: responseText,
                type: 'insight',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, agentMsg]);
        }, 800);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center z-50 border border-white/10"
                >
                    <Sparkles size={24} />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border border-white"></span>
                </motion.button>
            )}

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-8 right-8 w-[380px] h-[600px] glass rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-[var(--border-subtle)]"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white">
                                    <Bot size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold">Consensus Assistant</h3>
                                    <div className="text-[10px] text-success flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> Online & Analyzing
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="text-muted hover:text-white"><Minimize2 size={16} /></button>
                                <button onClick={() => setIsOpen(false)} className="text-muted hover:text-danger"><X size={16} /></button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-app)]">
                            {messages.map((msg) => (
                                <div key={msg.id} className={clsx("flex gap-3", msg.sender === 'user' ? "flex-row-reverse" : "flex-row")}>
                                    <div className={clsx(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                        msg.sender === 'user' ? "bg-[var(--border-active)]" : "bg-primary/20 text-primary"
                                    )}>
                                        {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={clsx(
                                        "max-w-[80%] p-3 text-sm rounded-2xl",
                                        msg.sender === 'user'
                                            ? "bg-[var(--border-active)] text-white rounded-tr-none"
                                            : "bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-main)] rounded-tl-none"
                                    )}>
                                        {msg.text}
                                        <div className="mt-1 text-[10px] opacity-40 text-right">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-[var(--bg-panel)] border-t border-[var(--border-subtle)]">
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-full pl-4 pr-12 py-3 text-sm focus:border-primary focus:outline-none transition-colors"
                                    placeholder="Ask for insights..."
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <button
                                    onClick={handleSend}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-opacity-90 transition-colors"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// Simple rule-based logic for the demo
function generateResponse(input: string, scenario: Scenario): string {
    const lower = input.toLowerCase();

    if (lower.includes('risk') || lower.includes('danger')) {
        return `Current risk analysis shows a high probability of timeline slippage due to the ${scenario.constraints.timeline} day deadline. I recommend increasing the timeline by 15%.`;
    }
    if (lower.includes('budget') || lower.includes('cost')) {
        return `The budget of $${scenario.constraints.budget} is extremely tight for the requested quality level (${scenario.constraints.qualityMin}/100). Expect trade-offs in feature completeness.`;
    }
    if (lower.includes('who') || lower.includes('team')) {
        return "Based on the workload, your 'Timeline Enforcer' agent is currently overloaded. Consider re-allocating tasks or reducing scope.";
    }
    if (lower.includes('what if') || lower.includes('change')) {
        return "Running simulation... Increasing developer count would reduce timeline risk by 22% but exceeds the budget cap. Would you like to proceed?";
    }

    return "I've noted that. Is there anything specific about the resource allocation or risk profile you'd like me to analyze?";
}

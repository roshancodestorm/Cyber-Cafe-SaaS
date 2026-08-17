"use client";

import { motion } from "framer-motion";
import { Bot, Sparkles, Zap, BrainCircuit } from "lucide-react";

export function AiAssistantSection() {
  const cards = [
    {
      icon: <Bot className="w-8 h-8 text-primary mb-4" />,
      title: "Auto-Ticketing",
      desc: "Automatically triages and assigns support tickets based on the customer's issue description via NLP."
    },
    {
      icon: <Sparkles className="w-8 h-8 text-primary mb-4" />,
      title: "Smart Upsell",
      desc: "Predicts when a user is likely to extend their session or order food, sending timely, non-intrusive prompts."
    },
    {
      icon: <Zap className="w-8 h-8 text-primary mb-4" />,
      title: "Auto-Resolution",
      desc: "Detects frozen games or network drops and automatically applies known fixes without staff intervention."
    }
  ];

  return (
    <section className="py-24 border-b bg-zinc-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-zinc-950 to-zinc-950 opacity-50" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8 backdrop-blur-sm"
        >
          <BrainCircuit className="mr-2 h-4 w-4" />
          <span>Powered by Advanced AI</span>
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
        >
          Your Intelligent Cafe Assistant
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 max-w-2xl mx-auto text-xl mb-16"
        >
          Reduce staff workload by up to 40%. Our AI assistant automatically handles customer queries, recommends games, and resolves common technical issues.
        </motion.p>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
          {cards.map((card, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors group"
            >
              <div className="transform transition-transform group-hover:scale-110 group-hover:-translate-y-1">
                {card.icon}
              </div>
              <h3 className="text-2xl font-semibold mb-3">{card.title}</h3>
              <p className="text-gray-400 text-base leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

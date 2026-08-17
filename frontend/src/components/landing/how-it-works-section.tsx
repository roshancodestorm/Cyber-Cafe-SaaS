"use client";

import { motion } from "framer-motion";
import { MonitorPlay, Settings, UserCheck } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      icon: <Settings className="h-8 w-8 text-primary" />,
      title: "1. Setup & Configure",
      description: "Install the client software on your PCs and configure your pricing rules, games, and applications from the cloud dashboard.",
    },
    {
      icon: <UserCheck className="h-8 w-8 text-primary" />,
      title: "2. Customer Registration",
      description: "Customers can create accounts, top up their balance, and securely log in to any available station.",
    },
    {
      icon: <MonitorPlay className="h-8 w-8 text-primary" />,
      title: "3. Manage & Monitor",
      description: "Monitor PC statuses, handle remote support, process print jobs, and track revenue all in real-time.",
    },
  ];

  return (
    <section className="py-24 bg-muted/30 border-b">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Get your cyber cafe running smoothly in three simple steps. Our platform minimizes setup time and maximizes operational efficiency.
          </motion.p>
        </div>
        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto relative">
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
          
          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="flex flex-col items-center text-center space-y-4 relative z-10"
            >
              <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-card border shadow-lg mb-4">
                {step.icon}
              </div>
              <h3 className="text-2xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

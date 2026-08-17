"use client";

import { motion } from "framer-motion";
import { Lock, FileKey2, ShieldCheck, EyeOff } from "lucide-react";

export function SecuritySection() {
  const features = [
    {
      icon: <Lock className="w-5 h-5 text-primary" />,
      text: "Session isolation & automatic wipe after logout"
    },
    {
      icon: <FileKey2 className="w-5 h-5 text-primary" />,
      text: "End-to-end encrypted user credentials and payments"
    },
    {
      icon: <EyeOff className="w-5 h-5 text-primary" />,
      text: "Strict data privacy compliance (GDPR/CCPA ready)"
    }
  ];

  return (
    <section className="py-24 bg-muted/20 border-b overflow-hidden relative">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <ShieldCheck className="w-4 h-4 mr-2" /> Privacy & Security First
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Bank-grade Security for Your Cafe
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Protect your business and your customers' data. Our system enforces strict security protocols ensuring terminal safety from viruses, unauthorized access, and malicious software.
            </p>
            <ul className="space-y-5">
              {features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-4 bg-background p-4 rounded-xl border shadow-sm">
                  <div className="bg-primary/20 p-3 rounded-lg">
                    {feat.icon}
                  </div>
                  <span className="font-medium text-lg">{feat.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative h-[500px] w-full rounded-2xl border bg-card shadow-2xl flex items-center justify-center p-8 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="text-center space-y-6 relative z-10">
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-[spin_4s_linear_infinite]" />
                <div className="absolute inset-2 border-4 border-primary/40 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
                <ShieldCheck className="w-16 h-16 text-primary" />
              </div>
              <div className="text-xl font-mono font-semibold tracking-widest text-primary">TERMINAL SECURED</div>
              <p className="text-muted-foreground max-w-[250px] mx-auto text-sm">All local user data is encrypted and completely wiped upon session termination.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

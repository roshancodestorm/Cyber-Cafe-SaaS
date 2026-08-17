"use client";

import { motion } from "framer-motion";
import { KeyRound, Timer, Eraser, CheckCircle2 } from "lucide-react";

export function AccessControlSection() {
  const features = [
    {
      icon: <KeyRound className="w-6 h-6 text-primary" />,
      title: "Temporary Access PINs",
      desc: "Generate one-time PINs or QR codes for quick guest access. Perfect for walk-in customers wanting to print or browse quickly without full registration."
    },
    {
      icon: <Timer className="w-6 h-6 text-primary" />,
      title: "Auto-Expiration",
      desc: "Set strict time limits. Once the timer hits zero, the terminal automatically locks, ensuring fair usage and preventing unpaid overtime."
    },
    {
      icon: <Eraser className="w-6 h-6 text-primary" />,
      title: "Zero-Footprint Wipe",
      desc: "The moment a session expires, all downloaded files, browser history, and game credentials are automatically wiped from the local machine."
    }
  ];

  return (
    <section className="py-24 border-b overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
          >
            Complete Access Control
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Manage who uses your terminals and for exactly how long. No manual intervention required.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-shadow relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {feat.icon}
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

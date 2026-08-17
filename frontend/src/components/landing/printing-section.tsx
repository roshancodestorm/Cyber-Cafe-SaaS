"use client";

import { motion } from "framer-motion";
import { Printer, Cloud, CheckCircle2, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PrintingSection() {
  const benefits = [
    "No driver installation needed on client PCs",
    "Automatic cost calculation based on color/B&W and paper size",
    "Hold-and-release queue via mobile app for privacy",
    "End-to-end encrypted print jobs",
  ];

  return (
    <section className="py-24 border-b bg-background overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1 relative flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl" />
            <Card className="w-full max-w-md bg-card/80 backdrop-blur-md border shadow-2xl relative z-10 transform transition-transform hover:-translate-y-2 duration-500">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-4 border-b pb-6">
                  <div className="bg-primary/20 p-4 rounded-2xl">
                    <Printer className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl">Secure Print Queue</h4>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Lock className="w-3 h-3 mr-1" /> Encrypted Transmission
                    </p>
                  </div>
                </div>
                <div className="space-y-4 text-base">
                  <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                    <span className="text-muted-foreground">Document</span>
                    <span className="font-medium truncate max-w-[150px]">Confidential_Q3.pdf</span>
                  </div>
                  <div className="flex justify-between items-center p-2">
                    <span className="text-muted-foreground">Pages</span>
                    <span className="font-medium">12 (Color)</span>
                  </div>
                  <div className="flex justify-between items-center p-2">
                    <span className="text-muted-foreground">Cost</span>
                    <span className="font-medium font-mono">$ 2.40</span>
                  </div>
                  <div className="flex justify-between items-center bg-green-500/10 text-green-500 p-3 rounded-lg border border-green-500/20">
                    <span className="font-medium">Status</span>
                    <span className="font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Ready to release
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2 space-y-6"
          >
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Cloud className="w-4 h-4 mr-2" /> Cloud Native Printing
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Hassle-Free Secure Printing
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Managing printers in a cyber cafe is traditionally a nightmare. Our cloud-based secure printing solution eliminates driver issues, ensures document privacy, and automates billing entirely.
            </p>
            <ul className="space-y-4 pt-4">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="bg-primary/20 p-1 rounded-full mt-0.5 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-lg">{benefit}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, MapPin, Terminal, Store, Users } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  };

  return (
    <section className="relative overflow-hidden py-24 lg:py-32 border-b">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
      <div className="container relative mx-auto px-4 md:px-6">
        <motion.div 
          className="flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4 backdrop-blur-sm">
            <Terminal className="mr-2 h-4 w-4" />
            <span>Next-Gen Cyber Cafe Platform</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-300 to-gray-600">
            Automate Your Cafe. <br /> Elevate Their Experience.
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
            The ultimate all-in-one ecosystem connecting gamers to premium cafes. Experience seamless booking, secure printing, and AI-driven support.
          </motion.p>
          
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 w-full max-w-4xl mx-auto">
            <Link href="/user/cafes" className="group">
              <div className="relative h-full p-8 rounded-3xl border border-muted-foreground/20 bg-gradient-to-br from-muted/50 to-muted/10 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 text-left">
                <div className="flex flex-col space-y-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Public</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Gamers, Customers, Visitors
                    </p>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Find nearby cafes, book PCs, manage your wallet, upload documents, and use secure cloud printing.
                  </p>
                  <Button size="lg" className="mt-2 rounded-full h-12 shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
                    <MapPin className="mr-2 h-5 w-5" /> Find a Cafe Near You
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            </Link>

            <Link href="/register/cafe" className="group">
              <div className="relative h-full p-8 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/15 transition-all duration-300 text-left">
                <div className="flex flex-col space-y-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30">
                    <Store className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Cyber Cafe</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cafe Owners, Administrators
                    </p>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Manage terminals, billing, PC reservations, print queues, staff, analytics, and AI-powered operations.
                  </p>
                  <Button size="lg" variant="outline" className="mt-2 rounded-full h-12 border-primary/30 hover:bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    Register Your Cafe <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

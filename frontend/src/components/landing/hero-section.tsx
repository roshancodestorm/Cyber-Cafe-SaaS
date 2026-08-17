"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, MapPin, Terminal } from "lucide-react";
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
          className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto"
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
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-6 w-full max-w-md mx-auto sm:max-w-none sm:justify-center">
            {/* User CTA */}
            <Link href="/user/cafes" className="sm:flex-1 max-w-md mx-auto sm:max-w-none">
              <Button size="lg" className="w-full h-14 px-8 text-base shadow-lg shadow-primary/25 rounded-full">
                <MapPin className="mr-2 h-5 w-5" /> Find a Cafe Near You
              </Button>
            </Link>
            {/* Cyber Cafe Registration CTA */}
            <Link href="/register/cafe" className="sm:flex-1 max-w-md mx-auto sm:max-w-none">
              <Button size="lg" variant="outline" className="w-full h-14 px-8 text-base rounded-full border-muted-foreground/30 hover:bg-muted">
                Register Your Cyber Cafe <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

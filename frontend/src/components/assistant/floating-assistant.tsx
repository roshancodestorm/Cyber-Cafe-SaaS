"use client";

import {
  Sparkles,
  X,
  Minus,
  Maximize2,
  Bot,
  Gauge,
  Crown,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAssistantStore } from "@/lib/store/use-assistant-store";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";

const LOW_CREDIT_THRESHOLD = 15;

export function FloatingAssistant() {
  const isOpen = useAssistantStore((s) => s.isOpen);
  const toggleOpen = useAssistantStore((s) => s.toggleOpen);
  const credits = useAssistantStore((s) => s.credits);
  const sendStatus = useAssistantStore((s) => s.sendStatus);
  const [minimized, setMinimized] = useState(false);

  const isLow = credits.balance <= LOW_CREDIT_THRESHOLD;
  const usagePct =
    credits.planLimit !== null
      ? Math.min(100, (credits.totalUsed / (credits.planLimit + 1)) * 100)
      : 0;

  if (!isOpen) {
    return (
      <motion.div
        className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {isLow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="hidden sm:flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 shadow-lg"
          >
            <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              {credits.balance} credits left
            </span>
          </motion.div>
        )}
        <Button
          onClick={toggleOpen}
          size="icon-lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl relative overflow-hidden",
            "bg-gradient-to-br from-primary via-primary to-purple-600 dark:from-primary dark:via-primary dark:to-purple-500",
            "text-primary-foreground hover:scale-105 active:scale-95 transition-transform duration-200"
          )}
          aria-label="Open AI assistant"
        >
          <Sparkles className="h-6 w-6 relative z-10" />
          <motion.span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/10"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 14,
              ease: "linear",
              repeat: Infinity,
            }}
          />
          {sendStatus === "streaming" && (
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-background animate-pulse" />
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          height: minimized ? "auto" : 640,
        }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        className={cn(
          "fixed z-[90] right-4 bottom-4 sm:right-5 sm:bottom-5 flex flex-col",
          "w-[calc(100vw-2rem)] sm:w-[440px] rounded-2xl border bg-popover text-popover-foreground shadow-2xl overflow-hidden",
          "h-[640px] max-h-[calc(100dvh-2rem)]",
          minimized && "h-auto max-h-none"
        )}
      >
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-inner">
                <Bot className="h-5 w-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-popover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">AI Assistant</p>
                {sendStatus === "streaming" && (
                  <Badge variant="outline" className="text-[10px] h-4 border-green-500/40 text-green-600 dark:text-green-400">
                    thinking…
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                <Gauge className="h-3 w-3" />
                <span>
                  <span className={cn(isLow && "text-amber-600 dark:text-amber-400 font-semibold")}>
                    {credits.balance}
                  </span>
                  {credits.planLimit !== null && (
                    <>
                      {" / "}
                      <span>{credits.planLimit} credits</span>
                    </>
                  )}
                </span>
                {credits.planLimit !== null && (
                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-purple-500"
                      style={{ width: `${usagePct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isLow && (
              <Button
                size="xs"
                variant="outline"
                className="gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
              >
                <Crown className="h-3 w-3" />
                Upgrade
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setMinimized((v) => !v)}
              title={minimized ? "Expand" : "Minimize"}
              aria-label="Toggle minimize"
            >
              {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={toggleOpen}
              title="Close assistant"
              aria-label="Close assistant"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>

        {!minimized && <ChatPanel />}
      </motion.div>
    </AnimatePresence>
  );
}

import { useState } from "react";

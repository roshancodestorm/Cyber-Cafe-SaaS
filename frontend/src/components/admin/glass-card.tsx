"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  glow?: "primary" | "success" | "warning" | "danger";
  onClick?: () => void;
  padding?: boolean;
}

const glowMap = {
  primary: "hover:shadow-[0_0_24px_rgba(255,107,53,0.18)] hover:border-[rgba(255,107,53,0.35)]",
  success: "hover:shadow-[0_0_24px_rgba(0,191,99,0.18)]   hover:border-[rgba(0,191,99,0.35)]",
  warning: "hover:shadow-[0_0_24px_rgba(245,158,11,0.18)] hover:border-[rgba(245,158,11,0.35)]",
  danger:  "hover:shadow-[0_0_24px_rgba(239,68,68,0.18)]  hover:border-[rgba(239,68,68,0.35)]",
};

export function GlassCard({
  className,
  children,
  hover,
  glow,
  onClick,
  padding = true,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card transition-all duration-200",
        padding && "p-5",
        hover && "cursor-pointer",
        glow && glowMap[glow],
        className
      )}
    >
      {children}
    </div>
  );
}

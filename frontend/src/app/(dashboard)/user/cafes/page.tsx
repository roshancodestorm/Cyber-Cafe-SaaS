"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapsCafeDiscovery } from "@/components/discovery/maps-cafe-discovery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { NearbyCafe } from "@/types/maps";
import { MapPin, Printer, ArrowRight, Shield, Wifi, Coffee, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function CafeDiscoveryPage() {
  const [selected, setSelected] = useState<NearbyCafe | null>(null);
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Find a Cyber Cafe Near You</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Locate verified cafes, see what services they offer, and pick where to print or process your documents.
          </p>
        </div>
      </div>

      <MapsCafeDiscovery onSelect={(c) => setSelected(c)} initialRadiusKm={5} />

      {selected && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {selected.name}
                  {selected.isVerified && (
                    <Badge variant="outline" className="h-5 text-[11px] gap-1 border-green-500/40 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                  <Badge variant={selected.isOpen ? "default" : "outline"} className={cn("h-5 text-[11px]", selected.isOpen ? "bg-green-500 hover:bg-green-600" : "")}>
                    {selected.isOpen ? "Open now" : "Closed"}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {selected.publicLocation} · {selected.approximateDistanceKm.toFixed(2)} km ({selected.approximateDistanceMiles.toFixed(2)} mi)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" onClick={() => router.push("/user/documents")}>
                  Upload a document
                </Button>
                <Button className="gap-1.5">
                  Select this cafe
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Available services
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selected.availableServices.length === 0 && (
                    <span className="text-xs text-muted-foreground">No services listed.</span>
                  )}
                  {selected.availableServices.map((s) => {
                    const Icon = serviceIcon(s);
                    return (
                      <span key={s} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border rounded-full">
                        {Icon && <Icon className="h-3 w-3 text-primary/80" />}
                        {s}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 md:col-span-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  About this cafe
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selected.description ??
                    "A verified Cyber Cafe partner offering fast, secure document printing and processing."}
                </p>
                <Separator />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Badge variant="secondary" className="h-8 justify-center gap-1.5 rounded-lg">
                    <Shield className="h-3.5 w-3.5" /> Secure
                  </Badge>
                  <Badge variant="secondary" className="h-8 justify-center gap-1.5 rounded-lg">
                    <Wifi className="h-3.5 w-3.5" /> Free Wi-Fi
                  </Badge>
                  <Badge variant="secondary" className="h-8 justify-center gap-1.5 rounded-lg">
                    <Printer className="h-3.5 w-3.5" /> Color / B&W
                  </Badge>
                  <Badge variant="secondary" className="h-8 justify-center gap-1.5 rounded-lg">
                    <Coffee className="h-3.5 w-3.5" /> On-site
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function serviceIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("print")) return Printer;
  if (n.includes("coffee") || n.includes("drink")) return Coffee;
  if (n.includes("scan") || n.includes("web") || n.includes("wifi") || n.includes("internet")) return Wifi;
  if (n.includes("hour") || n.includes("24")) return Clock;
  if (n.includes("secure") || n.includes("encrypt")) return Shield;
  return null;
}

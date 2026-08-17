"use client";

import { useState } from "react";
import Link from "next/link";
import { NEARBY_CAFES } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { MapPin, Navigation, Star, MonitorPlay, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function NearbyCafesSection() {
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setLocationStatus(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setLocationStatus(
          `Showing cafes near your location (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`
        );
      },
      () => {
        setIsLocating(false);
        setLocationStatus("Location access was denied. Showing all cafes instead.");
      },
      { timeout: 8000 }
    );
  };

  return (
    <section className="py-24 border-b bg-muted/10 relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Find Premium Cafes Near You
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover top-rated cyber cafes and esports arenas powered by our platform. Book your PC in advance and skip the line.
            </p>
          </div>
          <div className="shrink-0">
            <Button
              variant="outline"
              className="h-12 px-6 rounded-full"
              onClick={handleUseLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              {isLocating ? "Locating…" : "Use Current Location"}
            </Button>
            {locationStatus && (
              <p className="text-xs text-muted-foreground mt-2 text-right max-w-[260px]">
                {locationStatus}
              </p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {NEARBY_CAFES.map((cafe, idx) => (
            <motion.div
              key={cafe.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link
                href="/user/cafes"
                className="block bg-card border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all group cursor-pointer h-full"
              >
                <div className="h-32 bg-muted/50 relative p-4 flex items-end">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <Badge variant={cafe.status === "Open Now" ? "default" : "secondary"} className="relative z-10">
                    {cafe.status}
                  </Badge>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{cafe.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Navigation className="w-3 h-3 mr-1" /> {cafe.distance}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center text-sm font-medium">
                      <MonitorPlay className="w-4 h-4 mr-1.5 text-primary" />
                      {cafe.availablePCs > 0 ? `${cafe.availablePCs} PCs free` : <span className="text-destructive">Full</span>}
                    </div>
                    <div className="flex items-center text-sm font-bold">
                      <Star className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-500" />
                      {cafe.rating}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

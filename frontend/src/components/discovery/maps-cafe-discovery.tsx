"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getMapProvider,
  requestBrowserLocation,
  searchNearbyCafes,
} from "@/lib/maps-client";
import type {
  GeoPoint,
  LocationState,
  LocationPermissionState,
  NearbyCafe,
  NearbySearchResponse,
  MapMarker,
} from "@/types/maps";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { Search as SearchIcon } from "lucide-react";

interface MapsCafeDiscoveryProps {
  onSelect?: (cafe: NearbyCafe) => void;
  initialRadiusKm?: number;
  showFallbackMap?: boolean;
}

export function MapsCafeDiscovery({
  onSelect,
  initialRadiusKm = 5,
  showFallbackMap = true,
}: MapsCafeDiscoveryProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapHandleRef = useRef<any>(null);

  const [location, setLocation] = useState<LocationState>({
    permission: "idle",
    current: null,
  });
  const [searchText, setSearchText] = useState("");
  const [radius, setRadius] = useState<number>(initialRadiusKm);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [results, setResults] = useState<NearbySearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fallbackLatLng] = useState<GeoPoint>({
    latitude: 40.7128,
    longitude: -74.006,
  });

  const center: GeoPoint = location.current ?? fallbackLatLng;

  const doSearch = useCallback(
    async (pt: GeoPoint) => {
      setLoading(true);
      try {
        const data = await searchNearbyCafes({
          latitude: pt.latitude,
          longitude: pt.longitude,
          radiusKm: radius,
          page: 1,
          pageSize: 20,
          onlyVerified,
          onlyOpen,
        });
        setResults(data);
        updateMarkers(data.results, pt);
      } finally {
        setLoading(false);
      }
    },
    [radius, onlyVerified, onlyOpen]
  );

  const updateMarkers = (cafes: NearbyCafe[], pt: GeoPoint) => {
    if (!mapContainerRef.current || !showFallbackMap) return;
    const provider = getMapProvider();
    if (mapHandleRef.current) {
      mapHandleRef.current.destroy();
      mapHandleRef.current = null;
    }
    provider.load().then(() => {
      const markers: MapMarker[] = cafes.map((c) => ({
        id: c.id,
        position: {
          latitude: c.latitude ?? pt.latitude,
          longitude: c.longitude ?? pt.longitude,
        },
        title: c.name,
        subtitle: c.publicLocation,
        isVerified: c.isVerified,
        color: c.isVerified ? "#16a34a" : "#64748b",
      }));
      if (mapContainerRef.current) {
        mapHandleRef.current = provider.renderMap(mapContainerRef.current, {
          center: pt,
          zoom: 13,
          markers,
          onMarkerClick: (id) => {
            setSelectedId(id);
            const cafe = cafes.find((x) => x.id === id);
            if (cafe && onSelect) onSelect(cafe);
          },
        });
      }
    });
  };

  const askForLocation = async () => {
    setLocation((s) => ({ ...s, permission: "prompting", errorMessage: undefined }));
    const result = await requestBrowserLocation();
    if (!result) {
      setLocation({
        permission: "denied",
        current: null,
        errorMessage: "Location access was denied. Use search below, or we'll default to a popular area.",
      });
      doSearch(fallbackLatLng);
      return;
    }
    setLocation({
      permission: "granted",
      current: result.location,
      accuracyMeters: result.accuracy,
    });
    doSearch(result.location);
  };

  const searchPlace = async () => {
    const q = searchText.trim();
    if (!q) return;
    setLoading(true);
    try {
      const provider = getMapProvider();
      const matches = await provider.geocode(q);
      if (matches.length === 0) {
        setLocation((s) => ({
          ...s,
          errorMessage: "Couldn't find that place. Try a different search.",
        }));
        return;
      }
      const best = matches[0];
      setLocation({
        permission: "granted",
        current: { latitude: best.latitude, longitude: best.longitude },
      });
      doSearch({ latitude: best.latitude, longitude: best.longitude });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.current || location.permission === "denied") {
      doSearch(center);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, onlyVerified, onlyOpen]);

  useEffect(() => {
    return () => {
      if (mapHandleRef.current) mapHandleRef.current.destroy();
    };
  }, []);

  const statusLabel: Record<LocationPermissionState, string> = {
    idle: "Locate me to find nearby cafes",
    prompting: "Requesting location…",
    granted: "Showing cafes near you",
    denied: "Using search/demo coordinates",
    error: "Something went wrong with location",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <Card className={cn("lg:col-span-3 overflow-hidden", !showFallbackMap && "hidden lg:block")}>
        <div ref={mapContainerRef} className="min-h-[480px] w-full" />
      </Card>

      <Card className="lg:col-span-2 flex flex-col">
        <CardContent className="p-4 flex flex-col gap-4 flex-1 min-h-[480px]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm">Find a Cyber Cafe</h3>
              <p className="text-xs text-muted-foreground">{statusLabel[location.permission]}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={askForLocation}
              disabled={location.permission === "prompting"}
            >
              {location.permission === "prompting" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Navigation className="h-3.5 w-3.5" />
              )}
              Locate
            </Button>
          </div>

          {location.errorMessage && (
            <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              {location.errorMessage}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchPlace();
                }}
                placeholder="Search city, neighborhood, or address"
                className="pl-8 text-sm"
              />
            </div>
            <Button size="sm" className="gap-1" onClick={searchPlace} disabled={loading}>
              <SearchIcon className="h-3.5 w-3.5" />
              Search
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-accent/30">
              <input
                type="checkbox"
                className="h-3.5 w-3.5"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
              />
              Verified only
            </label>
            <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-accent/30">
              <input
                type="checkbox"
                className="h-3.5 w-3.5"
                checked={onlyOpen}
                onChange={(e) => setOnlyOpen(e.target.checked)}
              />
              Open now
            </label>
            <select
              value={radius}
              onChange={(e) => setRadius(parseFloat(e.target.value))}
              className="px-3 py-2 border rounded-lg bg-transparent text-xs"
            >
              <option value={1}>1 km</option>
              <option value={3}>3 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 -mr-1 min-h-0">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-xs font-medium text-muted-foreground">
                {loading ? "Searching…" : `${results?.total ?? 0} result${(results?.total ?? 0) === 1 ? "" : "s"}`}
              </span>
            </div>

            <div className="space-y-2">
              {results?.results.length === 0 && !loading && (
                <div className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                  No cafes within radius. Try expanding the radius or a different location.
                </div>
              )}
              {results?.results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(c.id);
                    if (onSelect) onSelect(c);
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors group",
                    selectedId === c.id
                      ? "border-primary/60 bg-primary/5"
                      : "hover:bg-accent/40 hover:border-border/90"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 p-1.5 rounded-md shrink-0",
                        c.isVerified
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{c.name}</span>
                        {c.isVerified && (
                          <Badge variant="outline" className="h-4 text-[10px] gap-1 border-green-500/40 text-green-600 dark:text-green-400">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {c.publicLocation}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="h-4 text-[10px] font-normal">
                          {c.approximateDistanceKm.toFixed(1)} km · {c.approximateDistanceMiles.toFixed(1)} mi
                        </Badge>
                        <Badge
                          variant={c.isOpen ? "default" : "outline"}
                          className={cn(
                            "h-4 text-[10px] font-normal",
                            c.isOpen ? "bg-green-500 hover:bg-green-600" : ""
                          )}
                        >
                          {c.isOpen ? "Open" : "Closed"}
                        </Badge>
                        {c.availableServices.slice(0, 3).map((svc) => (
                          <span
                            key={svc}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground"
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                      {c.description && (
                        <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">
                          {c.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

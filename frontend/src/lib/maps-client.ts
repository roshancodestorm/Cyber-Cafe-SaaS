"use client";

import type {
  MapProvider,
  MapRenderOptions,
  MapHandle,
  GeoPoint,
  GeocodeResult,
  MapMarker,
} from "@/types/maps";
import type { NearbySearchQuery, NearbySearchResponse, NearbyCafe } from "@/types/maps";

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  place_id?: number | string;
  osm_id?: number | string;
  display_name?: string;
  address?: NominatimAddress;
}

interface LeafletIcon {
  __leaflet_icon: true;
}

interface LeafletMarker {
  addTo(map: LeafletMap): LeafletMarker;
  bindPopup(content: string): LeafletMarker;
  on(event: "click", callback: () => void): LeafletMarker;
  remove(): void;
}

interface LeafletTileLayer {
  addTo(map: LeafletMap): LeafletTileLayer;
}

interface LeafletFeatureGroup {
  getBounds(): unknown;
}

interface LeafletMap {
  setView(latLng: [number, number], zoom: number): LeafletMap;
  panTo(latLng: [number, number]): LeafletMap;
  fitBounds(bounds: unknown, options?: { padding?: [number, number]; maxZoom?: number }): LeafletMap;
  invalidateSize(): void;
  remove(): void;
}

interface LeafletNamespace {
  map(container: HTMLElement, options?: { zoomControl?: boolean }): LeafletMap;
  tileLayer(url: string, options: { attribution: string; maxZoom: number }): LeafletTileLayer;
  marker(latLng: [number, number], options?: { icon?: LeafletIcon; title?: string }): LeafletMarker;
  divIcon(options: { className: string; html: string; iconSize: [number, number]; iconAnchor: [number, number]; popupAnchor: [number, number] }): LeafletIcon;
  featureGroup(markers: LeafletMarker[]): LeafletFeatureGroup;
}

declare global {
  interface Window {
    L?: LeafletNamespace;
    __cybercafeLeafletPromise?: Promise<void>;
    __cybercafe_map_provider?: MapProvider;
  }
}

class LeafletOpenStreetMapProvider implements MapProvider {
  readonly name = "leaflet";

  async load() {
    if (typeof window === "undefined") return;
    if (window.L) return;
    if (window.__cybercafeLeafletPromise) {
      await window.__cybercafeLeafletPromise;
      return;
    }

    window.__cybercafeLeafletPromise = new Promise<void>((resolve, reject) => {
      if (!document.querySelector('link[data-cybercafe-leaflet="css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.dataset.cybercafeLeaflet = "css";
        document.head.appendChild(link);
      }

      const existingScript = document.querySelector<HTMLScriptElement>('script[data-cybercafe-leaflet="js"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener("error", () => reject(new Error("Leaflet failed to load.")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.defer = true;
      script.dataset.cybercafeLeaflet = "js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Leaflet failed to load."));
      document.head.appendChild(script);
    });

    await window.__cybercafeLeafletPromise;
  }

  async geocode(q: string): Promise<GeocodeResult[]> {
    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`;
      const r = await fetch(endpoint, { headers: { "Accept-Language": "en" } });
      if (!r.ok) return [];
      const data = (await r.json()) as NominatimResult[];
      return (data || []).map((d) => ({
        latitude: parseFloat(d.lat),
        longitude: parseFloat(d.lon),
        placeId: String(d.place_id ?? d.osm_id ?? ""),
        address: {
          formattedAddress: d.display_name,
          city: d.address?.city || d.address?.town || d.address?.village,
          state: d.address?.state,
          country: d.address?.country,
          zipCode: d.address?.postcode,
        },
      }));
    } catch {
      return [];
    }
  }
  async reverseGeocode(p: GeoPoint): Promise<GeocodeResult | null> {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${p.latitude}&lon=${p.longitude}&format=json&addressdetails=1`
      );
      if (!r.ok) return null;
      const d = (await r.json()) as NominatimResult;
      return {
        latitude: p.latitude,
        longitude: p.longitude,
        placeId: String(d.place_id ?? d.osm_id ?? ""),
        address: {
          formattedAddress: d.display_name,
          city: d.address?.city || d.address?.town || d.address?.village,
          state: d.address?.state,
          country: d.address?.country,
          zipCode: d.address?.postcode,
        },
      };
    } catch {
      return null;
    }
  }

  renderMap(container: HTMLElement, opts: MapRenderOptions): MapHandle {
    const L = window.L;
    if (!L) {
      container.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-muted/40 text-muted-foreground text-xs">OpenStreetMap could not load.</div>`;
      return {
        destroy() {
          container.innerHTML = "";
        },
        setCenter() {},
        setMarkers() {},
        panTo() {},
      };
    }

    container.innerHTML = "";
    const map = L.map(container, { zoomControl: true }).setView(
      [opts.center.latitude, opts.center.longitude],
      opts.zoom ?? 13
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const userMarker = L.marker([opts.center.latitude, opts.center.longitude], {
      icon: L.divIcon({
        className: "cybercafe-user-marker",
        html: `<span></span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -11],
      }),
      title: "Your location",
    }).bindPopup("You are here").addTo(map);

    let cafeMarkers: LeafletMarker[] = [];

    const applyMarkers = (markers: MapMarker[]) => {
      cafeMarkers.forEach((marker) => marker.remove());
      cafeMarkers = markers.map((marker) => {
        const cafeMarker = L.marker([marker.position.latitude, marker.position.longitude], {
          icon: L.divIcon({
            className: "cybercafe-map-marker",
            html: `<span style="background:${marker.color ?? "#2563eb"}"></span>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -26],
          }),
          title: marker.title,
        })
          .bindPopup(renderPopup(marker))
          .on("click", () => opts.onMarkerClick?.(marker.id))
          .addTo(map);

        return cafeMarker;
      });

      const allMarkers = [userMarker, ...cafeMarkers];
      if (allMarkers.length > 1) {
        map.fitBounds(L.featureGroup(allMarkers).getBounds(), {
          padding: [36, 36],
          maxZoom: 15,
        });
      }
    };

    applyMarkers(opts.markers ?? []);
    window.setTimeout(() => map.invalidateSize(), 100);

    return {
      destroy() {
        map.remove();
      },
      setCenter(point) {
        map.setView([point.latitude, point.longitude], opts.zoom ?? 13);
      },
      setMarkers(markers) {
        applyMarkers(markers);
      },
      panTo(point) {
        map.panTo([point.latitude, point.longitude]);
      },
    };
  }
}

function renderPopup(marker: MapMarker) {
  const verified = marker.isVerified ? `<div class="text-[11px] text-green-600 mt-1">Verified partner</div>` : "";
  return `
    <div class="min-w-[180px]">
      <div class="font-semibold">${escapeHtml(marker.title ?? "Cyber Cafe")}</div>
      <div class="text-xs text-slate-500 mt-1">${escapeHtml(marker.subtitle ?? "Nearby")}</div>
      ${verified}
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const defaultMapProvider: MapProvider = new LeafletOpenStreetMapProvider();

export function setMapProvider(p: MapProvider) {
  window.__cybercafe_map_provider = p;
}

export function getMapProvider(): MapProvider {
  return window.__cybercafe_map_provider || defaultMapProvider;
}

export async function searchNearbyCafes(
  q: NearbySearchQuery
): Promise<NearbySearchResponse> {
  const params = new URLSearchParams();
  params.set("latitude", String(q.latitude));
  params.set("longitude", String(q.longitude));
  if (q.radiusKm) params.set("radius_km", String(q.radiusKm));
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("page_size", String(q.pageSize));
  if (q.onlyVerified) params.set("only_verified", "1");
  if (q.onlyOpen) params.set("only_open", "1");
  q.servicesFilter?.forEach((s) => params.append("services_filter", s));

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const endpoint = apiBase
    ? `${apiBase}/v1/cafes/nearby?${params.toString()}`
    : `/api/v1/cafes/nearby?${params.toString()}`;
  const res = await fetch(endpoint);
  if (!res.ok) {
    return {
      results: fallbackCafes(q),
      total: fallbackCafes(q).length,
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 20,
      totalPages: 1,
      searchCenter: {
        latitude: q.latitude,
        longitude: q.longitude,
        radiusKm: q.radiusKm ?? 5,
      },
      source: "demo",
    };
  }
  const body = await res.json();
  const results: NearbyCafe[] = (body.results || []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    name: String(r.name),
    publicLocation: String(r.public_location),
    approximateDistanceKm: Number(r.approximate_distance_km),
    approximateDistanceMiles: Number(r.approximate_distance_miles),
    availableServices: Array.isArray(r.available_services) ? r.available_services.map(String) : [],
    isOpen: !!r.is_open,
    isVerified: !!r.is_verified,
    description: typeof r.description === "string" ? r.description : undefined,
    latitude: typeof r.latitude === "number" ? r.latitude : undefined,
    longitude: typeof r.longitude === "number" ? r.longitude : undefined,
  }));
  return {
    results,
    total: body.total ?? results.length,
    page: body.page ?? q.page ?? 1,
    pageSize: body.page_size ?? q.pageSize ?? 20,
    totalPages: body.total_pages ?? 1,
    searchCenter: {
      latitude: body.search_center?.latitude ?? q.latitude,
      longitude: body.search_center?.longitude ?? q.longitude,
      radiusKm: body.search_center?.radius_km ?? q.radiusKm ?? 5,
    },
    source: "api",
  };
}

function fallbackCafes(q: NearbySearchQuery): NearbyCafe[] {
  const seed = [
    {
      name: "Downtown Cyber Hub",
      lat: q.latitude + 0.004,
      lon: q.longitude - 0.002,
      services: ["Printing", "Scanning", "Gaming", "Coffee"],
      open: true,
      verified: true,
      desc: "High-speed terminals and 24/7 printing",
    },
    {
      name: "Pixel Cafe",
      lat: q.latitude - 0.007,
      lon: q.longitude + 0.009,
      services: ["Printing", "Color Print", "Lamination"],
      open: true,
      verified: true,
      desc: "Photo-quality color printing",
    },
    {
      name: "Print'n'Go",
      lat: q.latitude + 0.018,
      lon: q.longitude - 0.015,
      services: ["Printing", "Documents only"],
      open: false,
      verified: false,
      desc: "Budget document printing",
    },
    {
      name: "NetZone Station",
      lat: q.latitude - 0.014,
      lon: q.longitude + 0.003,
      services: ["Printing", "Scanning", "Web Access"],
      open: true,
      verified: true,
      desc: "Walk-ins welcome",
    },
  ];
  return seed.map((s, i) => {
    const R = 6371;
    const dLat = ((s.lat - q.latitude) * Math.PI) / 180;
    const dLon = ((s.lon - q.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((q.latitude * Math.PI) / 180) * Math.cos((s.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const km = 2 * R * Math.asin(Math.sqrt(a));
    return {
      id: "cafe_sample_" + i,
      name: s.name,
      publicLocation: "Nearby",
      approximateDistanceKm: Math.round(km * 100) / 100,
      approximateDistanceMiles: Math.round(km * 0.621371 * 100) / 100,
      availableServices: s.services,
      isOpen: s.open,
      isVerified: s.verified,
      description: s.desc,
      latitude: s.lat,
      longitude: s.lon,
    };
  });
}

export function requestBrowserLocation(): Promise<{
  location: GeoPoint;
  accuracy: number;
} | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  });
}

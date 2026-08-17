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

class LeafletProviderStub implements MapProvider {
  readonly name = "leaflet";
  async load() {}
  async geocode(q: string): Promise<GeocodeResult[]> {
    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`;
      const r = await fetch(endpoint, { headers: { "Accept-Language": "en" } });
      if (!r.ok) return [];
      const data = await r.json();
      return (data || []).map((d: any) => ({
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
      const d = await r.json();
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
    container.innerHTML = `
      <div class="w-full h-full flex items-center justify-center bg-muted/40 border border-border rounded-lg text-muted-foreground text-xs text-center p-4">
        <div>
          <div class="font-semibold mb-1">Map placeholder — Leaflet/Google Maps adapter</div>
          <div class="opacity-70">Center: ${opts.center.latitude.toFixed(4)}, ${opts.center.longitude.toFixed(4)}</div>
          <div class="opacity-70 mt-1">${opts.markers?.length ?? 0} marker(s)</div>
        </div>
      </div>
    `;
    return {
      destroy() {
        container.innerHTML = "";
      },
      setCenter() {},
      setMarkers() {},
      panTo() {},
    };
  }
}

export const defaultMapProvider: MapProvider = new LeafletProviderStub();

export function setMapProvider(p: MapProvider) {
  (globalThis as any).__cybercafe_map_provider = p;
}

export function getMapProvider(): MapProvider {
  return (globalThis as any).__cybercafe_map_provider || defaultMapProvider;
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

  const res = await fetch(`/api/v1/cafes/nearby?${params.toString()}`);
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
    };
  }
  const body = await res.json();
  const results: NearbyCafe[] = (body.results || []).map((r: any) => ({
    id: String(r.id),
    name: r.name,
    publicLocation: r.public_location,
    approximateDistanceKm: r.approximate_distance_km,
    approximateDistanceMiles: r.approximate_distance_miles,
    availableServices: r.available_services || [],
    isOpen: !!r.is_open,
    isVerified: !!r.is_verified,
    description: r.description,
    latitude: r.latitude,
    longitude: r.longitude,
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

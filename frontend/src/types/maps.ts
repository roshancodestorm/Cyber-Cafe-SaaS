export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface AddressComponent {
  label?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  formattedAddress?: string;
}

export interface GeocodeResult extends GeoPoint {
  address?: AddressComponent;
  placeId?: string;
}

export interface MapProvider {
  name: string;
  load(): Promise<void>;
  geocode(query: string): Promise<GeocodeResult[]>;
  reverseGeocode(point: GeoPoint): Promise<GeocodeResult | null>;
  renderMap(container: HTMLElement, options: MapRenderOptions): MapHandle;
}

export interface MapRenderOptions {
  center: GeoPoint;
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (id: string) => void;
  onMapClick?: (point: GeoPoint) => void;
  theme?: "light" | "dark";
}

export interface MapMarker {
  id: string;
  position: GeoPoint;
  title?: string;
  subtitle?: string;
  color?: string;
  isVerified?: boolean;
}

export interface MapHandle {
  destroy(): void;
  setCenter(point: GeoPoint): void;
  setMarkers(markers: MapMarker[]): void;
  panTo(point: GeoPoint): void;
}

export interface NearbyCafe {
  id: string;
  name: string;
  publicLocation: string;
  approximateDistanceKm: number;
  approximateDistanceMiles: number;
  availableServices: string[];
  isOpen: boolean;
  isVerified: boolean;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface NearbySearchQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  page?: number;
  pageSize?: number;
  servicesFilter?: string[];
  onlyVerified?: boolean;
  onlyOpen?: boolean;
}

export interface NearbySearchResponse {
  results: NearbyCafe[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  searchCenter: { latitude: number; longitude: number; radiusKm: number };
}

export type LocationPermissionState = "idle" | "prompting" | "granted" | "denied" | "error";

export interface LocationState {
  permission: LocationPermissionState;
  current: GeoPoint | null;
  errorMessage?: string;
  accuracyMeters?: number;
}

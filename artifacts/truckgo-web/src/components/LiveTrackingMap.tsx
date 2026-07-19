import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGetBookingTracking, getGetBookingTrackingQueryKey } from "@workspace/api-client-react";
import { Navigation2, MapPin, Clock } from "lucide-react";

// Fix Leaflet default marker icons with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Amber truck icon for driver
const driverIcon = L.divIcon({
  className: "",
  html: `<div style="
    width: 40px; height: 40px;
    background: #F48525;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(244,133,37,0.5);
    border: 2px solid rgba(255,255,255,0.9);
  ">
    <svg style="transform: rotate(45deg); margin-left:1px; margin-top:1px;" width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="white" stroke-width="2" fill="none"/>
      <path d="M1 3h15v13H1z" fill="white" opacity="0.9"/>
      <path d="M16 8h4l3 3v3h-7V8z" fill="white" opacity="0.9"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -44],
});

// Green pickup dot
const pickupIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;background:#22c55e;border-radius:50%;border:3px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(34,197,94,0.6);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Red dropoff dot
const dropoffIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;background:#ef4444;border-radius:50%;border:3px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(239,68,68,0.6);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function PanToDriver({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

interface LiveTrackingMapProps {
  bookingId: number;
  pickupAddress?: string;
  dropoffAddress?: string;
  /** Optional seeded coords for pickup/dropoff labels on map */
  pickupCoords?: [number, number];
  dropoffCoords?: [number, number];
}

// Sydney CBD as a fallback center when no driver location yet
const SYDNEY_CENTER: [number, number] = [-33.868, 151.209];

export function LiveTrackingMap({
  bookingId,
  pickupAddress,
  dropoffAddress,
  pickupCoords,
  dropoffCoords,
}: LiveTrackingMapProps) {
  const { data: tracking, isLoading } = useGetBookingTracking(bookingId, {
    query: {
      queryKey: getGetBookingTrackingQueryKey(bookingId),
      refetchInterval: 8000, // poll every 8 s
      enabled: !!bookingId,
    },
  });

  const hasDriverLocation =
    tracking?.driverLat != null && tracking?.driverLng != null;

  const driverPos: [number, number] | null = hasDriverLocation
    ? [tracking!.driverLat!, tracking!.driverLng!]
    : null;

  const mapCenter = driverPos ?? pickupCoords ?? SYDNEY_CENTER;

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card/50 rounded-2xl border border-white/8">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm">Loading map…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/8">
      {/* Live indicator pill */}
      {driverPos && (
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          LIVE TRACKING
        </div>
      )}

      {/* Last update pill */}
      {tracking?.lastLocationAt && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white/70 text-xs px-2.5 py-1.5 rounded-full border border-white/10">
          <Clock className="h-3 w-3" />
          {new Date(tracking.lastLocationAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Driver marker */}
        {driverPos && (
          <Marker position={driverPos} icon={driverIcon}>
            <Popup>
              <div className="font-semibold">{tracking?.driverName ?? "Driver"}</div>
              <div className="text-xs opacity-70 mt-1">Live position</div>
            </Popup>
          </Marker>
        )}

        {/* Pickup marker */}
        {pickupCoords && (
          <Marker position={pickupCoords} icon={pickupIcon}>
            <Popup><div className="font-semibold text-green-400">Pickup</div><div className="text-xs mt-1">{pickupAddress}</div></Popup>
          </Marker>
        )}

        {/* Dropoff marker */}
        {dropoffCoords && (
          <Marker position={dropoffCoords} icon={dropoffIcon}>
            <Popup><div className="font-semibold text-red-400">Dropoff</div><div className="text-xs mt-1">{dropoffAddress}</div></Popup>
          </Marker>
        )}

        {/* Pan to driver whenever position updates */}
        {driverPos && <PanToDriver lat={driverPos[0]} lng={driverPos[1]} />}
      </MapContainer>

      {/* No-location overlay */}
      {!driverPos && (
        <div className="absolute inset-0 flex items-center justify-center z-[999] bg-black/60 backdrop-blur-[2px]">
          <div className="text-center px-6 py-5 glass-card max-w-xs">
            <Navigation2 className="h-8 w-8 text-primary mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-semibold text-white">Waiting for driver location</p>
            <p className="text-xs text-white/50 mt-1">
              Map will update automatically once the driver starts the trip.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

type MapLocation = {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  latitude: number | string;
  longitude: number | string;
  price_per_bag: number | string;
  capacity: number | string;
  active: boolean;
};

function FitMapToLocations({
  locations,
}: {
  locations: MapLocation[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!locations.length) return;

    const bounds = L.latLngBounds(
      locations.map((location) => [
        Number(location.latitude),
        Number(location.longitude),
      ])
    );

    map.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 14,
    });
  }, [map, locations]);

  return null;
}

function createCustomPin(price: number | string) {
  const formattedPrice = Number(price) >= 1000 ? `${Math.round(Number(price) / 1000)}k` : `${price}`;
  return L.divIcon({
    className: "custom-map-pin",
    html: `
      <div style="
        display: flex;
        align-items: center;
        background: #0f172a;
        color: #ffffff;
        padding: 5px 10px;
        border-radius: 9999px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.3), 0 0 0 2px #ea580c;
        font-family: system-ui, sans-serif;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: -0.02em;
        white-space: nowrap;
        cursor: pointer;
        position: relative;
      ">
        <span style="display:inline-block; width:6px; height:6px; background:#10b981; border-radius:50%; margin-right:5px;"></span>
        ${formattedPrice} UZS
        <div style="
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #ea580c;
        "></div>
      </div>
    `,
    iconSize: [80, 32],
    iconAnchor: [40, 32],
    popupAnchor: [0, -32],
  });
}

function formatMoney(value: number | string) {
  return `${Number(value).toLocaleString("en-US")} UZS`;
}

export default function RealMap({
  locations,
}: {
  locations: MapLocation[];
}) {
  const validLocations = locations.filter((location) => {
    const lat = Number(location.latitude);
    const lng = Number(location.longitude);

    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    );
  });

  if (validLocations.length === 0) {
    return (
      <div className="h-[460px] bg-sand/40 rounded-3xl border border-line flex flex-col items-center justify-center p-6 text-center text-sm text-slate-500">
        <span className="text-3xl mb-2">🗺️</span>
        <p className="font-semibold">No storage locations available on map.</p>
      </div>
    );
  }

  const first = validLocations[0];

  return (
    <div className="h-[460px] w-full rounded-3xl overflow-hidden border border-line shadow-card-modern relative z-0">
      <MapContainer
        center={[
          Number(first.latitude),
          Number(first.longitude),
        ]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMapToLocations
          locations={validLocations}
        />

        {validLocations.map((location) => (
          <Marker
            key={location.id}
            position={[
              Number(location.latitude),
              Number(location.longitude),
            ]}
            icon={createCustomPin(location.price_per_bag)}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[220px]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md w-fit mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Verified Storage
                </div>

                <div className="font-bold text-[15px] text-slate-900 leading-snug">
                  {location.name}
                </div>

                <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                  📍 {location.address}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Price</span>
                    <span className="font-bold text-sm text-slate-900">
                      {formatMoney(location.price_per_bag)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Capacity</span>
                    <span className="text-xs font-semibold text-slate-700">{location.capacity} bags</span>
                  </div>
                </div>

                <Link
                  href={`/locations/${location.slug}`}
                  className="mt-3 flex items-center justify-center w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl py-2 px-3 text-xs font-bold shadow-sm transition-all"
                >
                  Book Storage Now →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
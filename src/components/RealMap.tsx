"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
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
      padding: [50, 50],
      maxZoom: 14,
    });
  }, [map, locations]);

  return null;
}

const markerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 34px;
      height: 34px;
      background: #e0883c;
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,.3);
      position: relative;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: white;
        border-radius: 50%;
        position: absolute;
        left: 9px;
        top: 9px;
      "></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

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

  console.log("MAP LOCATIONS:", locations);
  console.log("VALID MAP LOCATIONS:", validLocations);

  if (validLocations.length === 0) {
    return (
      <div className="h-[430px] bg-sand flex items-center justify-center text-sm text-ink-soft">
        No locations available.
      </div>
    );
  }

  const first = validLocations[0];

  return (
    <div className="h-[430px] w-full">
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
            icon={markerIcon}
          >
            <Popup>
              <div className="min-w-[210px]">
                <div className="font-semibold text-[15px]">
                  {location.name}
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  {location.address}
                </div>

                <div className="font-semibold text-sm mt-3">
                  {formatMoney(
                    location.price_per_bag
                  )}

                  <span className="font-normal text-gray-500">
                    {" "}
                    / bag / day
                  </span>
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  Capacity: {location.capacity} bags
                </div>

                <Link
                  href={`/locations/${location.slug}`}
                  className="inline-block mt-3 bg-[#e0883c] text-white rounded px-3 py-2 text-xs font-semibold"
                >
                  View location
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
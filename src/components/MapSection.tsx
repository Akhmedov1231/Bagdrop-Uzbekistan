"use client";

import dynamic from "next/dynamic";

export type MapLocation = {
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

const RealMap = dynamic(
  () => import("./RealMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[430px] rounded-xl bg-sand flex items-center justify-center text-sm text-ink-soft">
        Loading map...
      </div>
    ),
  }
);

export default function MapSection({
  locations,
}: {
  locations: MapLocation[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <RealMap locations={locations} />
    </div>
  );
}
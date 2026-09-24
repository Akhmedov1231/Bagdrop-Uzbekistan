"use client";

import dynamic from "next/dynamic";

import { MapSkeleton } from "./Skeleton";

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
    loading: () => <MapSkeleton />,
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
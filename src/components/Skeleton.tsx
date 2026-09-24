import React from "react";

export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-line/20 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function LocationCardSkeleton() {
  return (
    <div className="bg-white border border-line rounded-xl p-5 flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-1/2 mb-3 rounded" />
        <Skeleton className="h-3 w-full mb-1.5 rounded" />
        <Skeleton className="h-3 w-5/6 mb-4 rounded" />
      </div>

      <div className="border-t border-line/60 pt-4 mt-2 flex items-center justify-between">
        <div>
          <Skeleton className="h-5 w-24 mb-1 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="h-[430px] w-full rounded-xl bg-sand/60 border border-line flex flex-col items-center justify-center p-6 text-center animate-pulse">
      <div className="w-12 h-12 rounded-full bg-line/20 mb-3 flex items-center justify-center text-xl">
        📍
      </div>
      <div className="h-4 w-32 bg-line/30 rounded mb-2" />
      <div className="h-3 w-48 bg-line/20 rounded" />
    </div>
  );
}

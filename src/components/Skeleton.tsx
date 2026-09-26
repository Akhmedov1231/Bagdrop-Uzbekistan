import React from "react";

export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-slate-200/70 rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
}

export function LocationCardSkeleton() {
  return (
    <div className="bg-white/80 border border-line rounded-3xl p-6 flex flex-col justify-between shadow-card-modern backdrop-blur-sm">
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-1/2 mb-4 rounded-md" />
        <Skeleton className="h-3 w-full mb-2 rounded-md" />
        <Skeleton className="h-3 w-4/5 mb-6 rounded-md" />
      </div>

      <div className="border-t border-line/60 pt-4 mt-2 flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-28 mb-1.5 rounded-md" />
          <Skeleton className="h-3.5 w-16 rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-2xl" />
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="h-[460px] w-full rounded-3xl bg-sand/40 border border-line flex flex-col items-center justify-center p-6 text-center animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-brand-500/10 mb-3 flex items-center justify-center text-2xl">
        🗺️
      </div>
      <div className="h-5 w-36 bg-slate-200 rounded-lg mb-2" />
      <div className="h-3.5 w-52 bg-slate-200/70 rounded-md" />
    </div>
  );
}

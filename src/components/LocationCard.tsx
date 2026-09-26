import Link from "next/link";
import { Location } from "@/lib/types";
import { MapPin, Clock, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function LocationCard({ location }: { location: Location }) {
  const isAvailable = (location.availableBags ?? 0) > 0;

  return (
    <Link
      href={`/locations/${location.slug}`}
      className="group relative flex flex-col justify-between bg-white border border-line hover:border-brand-500/40 rounded-3xl overflow-hidden shadow-card-modern hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5"
    >
      <div>
        {/* Card Header Visual Banner */}
        <div
          className="h-36 relative flex items-start justify-between p-4 overflow-hidden transition-transform duration-500"
          style={{
            background: location.color
              ? `linear-gradient(135deg, ${location.color}ee, #0f172a)`
              : "linear-gradient(135deg, #ea580c, #0f172a)",
          }}
        >
          {/* Subtle Decorative Mesh in Header */}
          <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none" />

          {/* Verified Partner Badge */}
          <span className="relative z-10 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-ink font-sans text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 stroke-[2.5]" />
            <span>Verified Storage</span>
          </span>

          {/* Working Hours */}
          <span className="relative z-10 inline-flex items-center gap-1.5 bg-ink-deep/80 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/10">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <span>{location.hours?.open || "08:00"} – {location.hours?.close || "22:00"}</span>
          </span>
        </div>

        {/* Card Body */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-bold text-lg text-ink group-hover:text-brand-600 transition-colors leading-snug">
              {location.name}
            </h3>
            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-brand-50 flex items-center justify-center text-slate-400 group-hover:text-brand-600 transition-all shrink-0">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-ink-soft mt-1.5 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{location.distanceLabel || location.address}</span>
          </p>

          {/* Amenities / Security Badges */}
          <div className="flex gap-2 flex-wrap mt-4">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Insured</span>
            </span>
            {location.amenities?.slice(0, 2).map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1 text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200/60 px-2.5 py-1 rounded-lg"
              >
                <Sparkles className="w-2.5 h-2.5 text-teal-500" />
                <span>{a}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: Price & Free Slots */}
      <div className="px-5 py-4 border-t border-line bg-slate-50/60 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
            Per bag / day
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-display font-extrabold text-xl text-ink">
              {location.pricePerBagPerDay?.toLocaleString() || "40,000"}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {location.currency || "UZS"}
            </span>
          </div>
        </div>

        <div>
          {isAvailable ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{location.availableBags} available</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-xs bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl">
              <span>Limited</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

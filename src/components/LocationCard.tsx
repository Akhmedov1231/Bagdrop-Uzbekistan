import Link from "next/link";
import { Location } from "@/lib/types";

export default function LocationCard({ location }: { location: Location }) {
  const isAvailable = (location.availableBags ?? 0) > 0;

  return (
    <Link
      href={`/locations/${location.slug}`}
      className="group flex flex-col justify-between bg-white border border-line hover:border-clay/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div>
        {/* Card Header / Banner */}
        <div
          className="h-32 relative flex items-start justify-between p-3.5 transition-transform duration-500 group-hover:scale-[1.01]"
          style={{
            background: location.color
              ? `linear-gradient(135deg, ${location.color}dd, ${location.color})`
              : "linear-gradient(135deg, #e0883c, #b96b28)",
          }}
        >
          {/* Verified Partner Badge */}
          <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm text-ink text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            <span className="text-teal font-extrabold">✓</span> Verified
          </span>

          {/* Working Hours */}
          <span className="inline-flex items-center gap-1 bg-ink/75 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
            <span>🕒</span> {location.hours?.open || "08:00"}–{location.hours?.close || "22:00"}
          </span>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-slab font-bold text-[17px] text-ink group-hover:text-clay transition-colors leading-snug">
              {location.name}
            </h3>
          </div>

          <p className="text-[13px] text-ink-soft mt-1 line-clamp-1">
            📍 {location.distanceLabel || location.address}
          </p>

          {/* Security & Amenity tags */}
          <div className="flex gap-1.5 flex-wrap mt-3">
            <span className="text-[11px] bg-ok-bg text-ok font-semibold px-2.5 py-0.5 rounded-full border border-ok/15">
              🛡️ Insured
            </span>
            {location.amenities?.slice(0, 2).map((a) => (
              <span
                key={a}
                className="text-[11px] bg-teal-light text-teal-dark font-medium px-2.5 py-0.5 rounded-full"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Price & Availability */}
      <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-line/70 flex items-center justify-between text-[13px] bg-cream/30">
        <div>
          <span className="text-[11px] text-ink-soft block uppercase tracking-wider font-semibold">
            Per bag / day
          </span>
          <b className="font-slab font-bold text-[18px] text-ink">
            {location.pricePerBagPerDay?.toLocaleString() || "40,000"}{" "}
            <span className="text-xs font-normal text-ink-soft">
              {location.currency || "UZS"}
            </span>
          </b>
        </div>

        <div className="text-right">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1 text-ok font-semibold text-[12px] bg-ok-bg px-2.5 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
              {location.availableBags} free
            </span>
          ) : (
            <span className="text-warn font-semibold text-[12px] bg-warn-bg px-2 py-1 rounded-lg">
              Limited
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

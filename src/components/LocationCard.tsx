import Link from "next/link";
import { Location } from "@/lib/types";

export default function LocationCard({ location }: { location: Location }) {
  return (
    <Link
      href={`/locations/${location.slug}`}
      className="block bg-white border border-line rounded overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div
        className="h-32 relative flex items-start justify-end p-2.5"
        style={{ background: location.color }}
      >
        <span className="bg-white/95 text-ink text-[11px] font-bold px-2.5 py-1 rounded-full">
          {location.hours.open}–{location.hours.close}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[15.5px]">{location.name}</h3>
        <p className="text-[12.5px] text-ink-soft mt-0.5">{location.distanceLabel}</p>
        <div className="flex gap-1.5 flex-wrap mt-2">
          {location.amenities.slice(0, 2).map((a) => (
            <span key={a} className="text-[11px] bg-teal-light text-teal-dark font-semibold px-2 py-0.5 rounded-full">
              {a}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-line text-[13px]">
          <b className="font-slab text-[17px]">
            {location.pricePerBagPerDay.toLocaleString()} {location.currency}
          </b>
          <span className="text-ok font-semibold text-[11.5px]">{location.availableBags} bags free</span>
        </div>
      </div>
    </Link>
  );
}

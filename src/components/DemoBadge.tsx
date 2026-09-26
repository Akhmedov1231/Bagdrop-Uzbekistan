import { Sparkles } from "lucide-react";

export default function DemoBadge({ label = "Demo location" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2.5 py-0.5 rounded-full shadow-2xs">
      <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
      <span>{label}</span>
    </span>
  );
}

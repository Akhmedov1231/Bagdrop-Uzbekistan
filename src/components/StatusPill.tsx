import { BookingStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/bookingStateMachine";
import { CheckCircle2, Clock, AlertCircle, XCircle, ShieldAlert } from "lucide-react";

interface StatusConfig {
  className: string;
  icon: typeof CheckCircle2;
  dotColor: string;
}

const STYLES: Record<BookingStatus, StatusConfig> = {
  PENDING_PAYMENT: {
    className: "bg-amber-50 text-amber-700 border-amber-200/60",
    icon: Clock,
    dotColor: "bg-amber-500",
  },
  PAID: {
    className: "bg-brand-50 text-brand-700 border-brand-200/60",
    icon: Clock,
    dotColor: "bg-brand-500",
  },
  CHECKED_IN: {
    className: "bg-teal-50 text-teal-700 border-teal-200/60",
    icon: CheckCircle2,
    dotColor: "bg-teal-500",
  },
  COMPLETED: {
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    icon: CheckCircle2,
    dotColor: "bg-emerald-500",
  },
  CANCELLED: {
    className: "bg-rose-50 text-rose-700 border-rose-200/60",
    icon: XCircle,
    dotColor: "bg-rose-500",
  },
  EXPIRED: {
    className: "bg-slate-100 text-slate-600 border-slate-200",
    icon: AlertCircle,
    dotColor: "bg-slate-400",
  },
};

export default function StatusPill({ status }: { status: BookingStatus }) {
  const config = STYLES[status] || STYLES.PENDING_PAYMENT;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full border shadow-2xs ${config.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} animate-pulse`} />
      <Icon className="w-3 h-3 stroke-[2.5]" />
      <span>{STATUS_LABEL[status] || status}</span>
    </span>
  );
}

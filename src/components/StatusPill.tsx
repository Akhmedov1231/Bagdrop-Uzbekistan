import { BookingStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/bookingStateMachine";

const STYLES: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "bg-warn-bg text-warn",
  PAID: "bg-warn-bg text-warn",
  CHECKED_IN: "bg-teal-light text-teal-dark",
  COMPLETED: "bg-ok-bg text-ok",
  CANCELLED: "bg-red-100 text-red-600",
  EXPIRED: "bg-gray-100 text-gray-500",
};

export default function StatusPill({ status }: { status: BookingStatus }) {
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STYLES[status]}`}>
      {STATUS_LABEL[status].toUpperCase()}
    </span>
  );
}

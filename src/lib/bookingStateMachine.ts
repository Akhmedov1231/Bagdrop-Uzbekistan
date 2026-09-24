import { BookingStatus } from "./types";

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING_PAYMENT: ["PAID", "EXPIRED", "CANCELLED"],
  PAID: ["CHECKED_IN", "CANCELLED"],
  CHECKED_IN: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: BookingStatus, to: BookingStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid booking transition: ${from} → ${to}`);
  }
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAID: "Paid",
  CHECKED_IN: "Checked in",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

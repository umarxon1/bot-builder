import { format, formatDistanceToNow } from "date-fns";

export function formatShortDate(date: string | Date) {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("uz-UZ", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function normalizePhone(input: string) {
  return input.replace(/[^\d+]/g, "").trim();
}

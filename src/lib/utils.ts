import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as Gil currency.
 * Rounds down (floor) to the nearest integer.
 */
export function formatGil(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '0';
  return Math.floor(amount).toLocaleString();
}

/**
 * Returns a human-readable relative time string.
 * e.g., "4 mins ago", "12 hours ago", "3 days ago"
 */
export function getRelativeTime(dateStr: string | number | Date): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return `${Math.max(0, Math.round(diffMs / (1000 * 60)))} mins ago`;
  if (diffHours < 24) return `${Math.round(diffHours)} hours ago`;
  return `${Math.round(diffHours / 24)} days ago`;
}


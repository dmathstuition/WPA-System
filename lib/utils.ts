import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistance } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'd MMM yyyy'): string {
  return format(new Date(date), fmt)
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'd MMM yyyy, HH:mm')
}

export function timeAgo(date: string | Date): string {
  return formatDistance(new Date(date), new Date(), { addSuffix: true })
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function pct(value: number, total: number): number {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

export function gradeFromPct(pct: number): string {
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}

export function gradeColor(pct: number): string {
  if (pct >= 70) return 'text-emerald-600'
  if (pct >= 50) return 'text-amber-600'
  return 'text-red-600'
}

export function badgeVariant(status: string) {
  const map: Record<string, string> = {
    active: 'success', inactive: 'secondary', suspended: 'destructive',
    present: 'success', absent: 'destructive',
    submitted: 'success', missed: 'destructive', pending: 'warning', scored: 'info',
    published: 'success', draft: 'warning',
    locked: 'success', open: 'warning',
    completed: 'success', scheduled: 'info', cancelled: 'secondary',
  }
  return map[status] ?? 'secondary'
}

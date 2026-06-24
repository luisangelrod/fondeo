import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getLendScoreLabel(score: number): { label: string; labelEs: string; color: string } {
  if (score >= 70) {
    return { label: 'Excellent', labelEs: 'Excelente — Múltiples opciones disponibles', color: 'text-green-600' };
  } else if (score >= 50) {
    return { label: 'Good', labelEs: 'Bueno — Califica para varios productos', color: 'text-blue-600' };
  } else if (score >= 35) {
    return { label: 'Fair', labelEs: 'Regular — Hay opciones disponibles', color: 'text-yellow-600' };
  } else {
    return { label: 'Limited', labelEs: 'Limitado — Opciones reducidas pero existen', color: 'text-orange-600' };
  }
}

export function getScoreRingColor(score: number): string {
  if (score >= 70) return 'stroke-green-500';
  if (score >= 50) return 'stroke-blue-500';
  if (score >= 35) return 'stroke-yellow-500';
  return 'stroke-orange-500';
}

/** Returns a hex color for SVG stroke / inline styles */
export function getLendScoreHex(score: number): string {
  if (score >= 70) return '#16a34a'; // green-600
  if (score >= 50) return '#2563eb'; // blue-600
  if (score >= 35) return '#ca8a04'; // yellow-600
  return '#ea580c'; // orange-600
}

/** Returns a Tailwind text-color class */
export function getLendScoreColorClass(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-blue-600';
  if (score >= 35) return 'text-yellow-600';
  return 'text-orange-600';
}

/** Returns the approval odds badge variant */
export function getApprovalOddsBadgeVariant(
  odds: string
): 'success' | 'warning' | 'info' | 'default' {
  if (odds === 'high') return 'success';
  if (odds === 'medium') return 'warning';
  if (odds === 'low') return 'info';
  return 'default';
}

/** Returns a localised approval odds label */
export function getApprovalOddsLabel(odds: string, locale: string): string {
  const map: Record<string, Record<string, string>> = {
    high: { es: 'Probabilidad Alta', en: 'High Odds' },
    medium: { es: 'Probabilidad Media', en: 'Medium Odds' },
    low: { es: 'Probabilidad Baja', en: 'Low Odds' },
  };
  return map[odds]?.[locale] ?? odds;
}

/** Format a Date to a short locale string */
export function formatDate(date: Date | string, locale = 'es-PR'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

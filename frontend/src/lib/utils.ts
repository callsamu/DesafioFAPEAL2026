import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isRateVariable(variable: string | undefined): boolean {
  return typeof variable === 'string' && variable.toLowerCase().includes('taxa')
}

export function showsAverageNote(municipality: string | undefined): boolean {
  return !municipality
}

export const DEMOGRAPHIC_VARIABLES: string[] = [
  'Pessoas Alfabetizadas',
  'Pessoas Total',
  'Taxa de Alfabetização',
  'Taxa de Analfabetismo',
]

const metricFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function formatMetricValue(value: number | null | undefined, isRate = false): string {
  if (value === null || value === undefined) return '—'
  const formatted = metricFormat.format(value)
  return isRate ? `${formatted}%` : formatted
}

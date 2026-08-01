const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export interface Filters {
  municipality?: string
  year?: number
  startYear?: number
  endYear?: number
  network?: string
  level?: string
  variable?: string
}

export interface FilterListing {
  municipalities: string[] | null
  years: number[] | null
  networks: string[] | null
  levels: string[] | null
  variables: string[] | null
}

export interface MetricsRecord {
  id: number
  municipalityCode: string
  municipalityName: string
  year: number
  source: string
  variable: string
  schoolNetwork: string
  educationLevel: string
  value: number
}

export interface Page<T> {
  size: number
  offset: number
  data: T[]
}

export interface Indicators {
  enrollments: number | null
  offers: number | null
  averageApproval: number | null
}

export interface SeriesData {
  year: number
  value: number | null
}

export interface BreakdownItem {
  schoolNetwork: string
  value: number
}

export interface UploadResult {
  read: number
  imported: number
  rejected: number
  errors: Record<string, string[]>
}

type Envelope<T> = { status: 'success'; data: T } | { status: 'error'; error: unknown }

function messageFromError(error: unknown): string {
  if (Array.isArray(error)) return error.join('; ')
  return typeof error === 'string' ? error : 'Erro desconhecido'
}

function toQuery(params: object): string {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      q.set(key, String(value))
    }
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  const body = (await res.json()) as Envelope<T>
  if (body.status !== 'success') {
    throw new Error(messageFromError(body.error))
  }
  return body.data
}

export const api = {
  getFilters: () => request<FilterListing>('/filters'),

  getData: (filters: Filters, page: number, size: number) =>
    request<Page<MetricsRecord>>(`/data${toQuery({ ...filters, page, size })}`),

  getIndicators: (filters: Filters) =>
    request<Indicators>(`/indicators${toQuery(filters)}`),

  getSeries: (filters: Filters) =>
    request<SeriesData[]>(`/series${toQuery(filters)}`),

  getBreakdown: (filters: Filters) =>
    request<BreakdownItem[]>(`/breakdown${toQuery(filters)}`),

  upload: async (file: File): Promise<UploadResult> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${BASE}/upload`, { method: 'POST', body: fd })
    const body = (await res.json()) as Envelope<UploadResult>
    if (body.status !== 'success') {
      throw new Error(messageFromError(body.error))
    }
    return body.data
  },
}

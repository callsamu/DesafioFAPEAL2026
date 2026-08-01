import { createContext, useContext, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  api,
  type BreakdownItem,
  type FilterListing,
  type Filters,
  type Indicators,
  type MetricsRecord,
  type Page,
  type SeriesData,
} from '@/lib/api'

export const DEFAULT_FILTERS: Filters = {
  variable: 'Matrícula',
  level: 'Ensino Fundamental',
}

const PAGE_SIZE = 20

interface DashboardState {
  filters: Filters
  updateFilters: (patch: Partial<Filters>) => void
  resetFilters: () => void
  filterOptions: FilterListing
  filtersLoading: boolean
  indicators: Indicators | undefined
  indicatorsLoading: boolean
  series: SeriesData[] | undefined
  seriesLoading: boolean
  breakdown: BreakdownItem[] | undefined
  breakdownLoading: boolean
  dataPage: Page<MetricsRecord> | undefined
  dataLoading: boolean
  page: number
  setPage: (page: number) => void
  error: string | null
}

const DashboardContext = createContext<DashboardState | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  const updateFilters = (patch: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...patch }))
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  const filterOptionsQuery = useQuery({
    queryKey: ['filters'],
    queryFn: api.getFilters,
    staleTime: Infinity,
  })

  const indicatorsQuery = useQuery({
    queryKey: ['indicators', filters],
    queryFn: () => api.getIndicators(filters),
  })

  const seriesQuery = useQuery({
    queryKey: ['series', filters],
    queryFn: () => api.getSeries(filters),
  })

  const breakdownQuery = useQuery({
    queryKey: ['breakdown', filters],
    queryFn: () => api.getBreakdown(filters),
  })

  const dataQuery = useQuery({
    queryKey: ['data', filters, page],
    queryFn: () => api.getData(filters, page, PAGE_SIZE),
  })

  const error =
    [indicatorsQuery.error, seriesQuery.error, breakdownQuery.error, dataQuery.error].find(
      Boolean,
    )?.message ?? null

  const filterOptions: FilterListing = {
    municipalities: filterOptionsQuery.data?.municipalities ?? [],
    years: filterOptionsQuery.data?.years ?? [],
    networks: filterOptionsQuery.data?.networks ?? [],
    levels: filterOptionsQuery.data?.levels ?? [],
    variables: filterOptionsQuery.data?.variables ?? [],
  }

  return (
    <DashboardContext.Provider
      value={{
        filters,
        updateFilters,
        resetFilters,
        filterOptions,
        filtersLoading: filterOptionsQuery.isLoading,
        indicators: indicatorsQuery.data,
        indicatorsLoading: indicatorsQuery.isLoading,
        series: seriesQuery.data,
        seriesLoading: seriesQuery.isLoading,
        breakdown: breakdownQuery.data,
        breakdownLoading: breakdownQuery.isLoading,
        dataPage: dataQuery.data,
        dataLoading: dataQuery.isLoading,
        page,
        setPage,
        error,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within a DashboardProvider')
  return ctx
}

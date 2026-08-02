import { createContext, useContext, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  api,
  type BreakdownItem,
  type FilterListing,
  type Filters,
  type Indicators,
  type MetricsRecord,
  type MunicipalityData,
  type Page,
  type SeriesData,
} from '@/lib/api'

export const DEFAULT_FILTERS: Filters = {
  variable: 'Matrícula',
  municipality: 'Maceió',
  network: 'Total',
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
  ranking: MunicipalityData[] | undefined
  rankingLoading: boolean
  dataPage: Page<MetricsRecord> | undefined
  dataLoading: boolean
  page: number
  setPage: (page: number) => void
  error: string | null
}

const DashboardContext = createContext<DashboardState | null>(null)

function useLastData<T>(queryData: T | undefined): T | undefined {
  const [last, setLast] = useState<T | undefined>(undefined)
  if (queryData !== undefined && queryData !== last) {
    setLast(queryData)
  }
  return last
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [lastGoodFilters, setLastGoodFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const updateFilters = (patch: Partial<Filters>) => {
    setError(null)
    setFilters((current) => ({ ...current, ...patch }))
    setPage(1)
  }

  const resetFilters = () => {
    setError(null)
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

  const rankingQuery = useQuery({
    queryKey: ['ranking', filters],
    queryFn: () => api.getRanking(filters),
  })

  const dataQuery = useQuery({
    queryKey: ['data', filters, page],
    queryFn: () => api.getData(filters, page, PAGE_SIZE),
  })

  const currentError =
    [
      indicatorsQuery.error,
      seriesQuery.error,
      breakdownQuery.error,
      rankingQuery.error,
      dataQuery.error,
    ].find(Boolean)?.message ?? null
  const allSucceeded =
    indicatorsQuery.isSuccess &&
    seriesQuery.isSuccess &&
    breakdownQuery.isSuccess &&
    rankingQuery.isSuccess &&
    dataQuery.isSuccess

  if (currentError && lastGoodFilters !== filters) {
    setFilters(lastGoodFilters)
  }
  if (currentError && error !== currentError) {
    setError(currentError)
  }
  if (allSucceeded && lastGoodFilters !== filters) {
    setLastGoodFilters(filters)
  }

  const lastIndicators = useLastData(indicatorsQuery.data)
  const lastSeries = useLastData(seriesQuery.data)
  const lastBreakdown = useLastData(breakdownQuery.data)
  const lastRanking = useLastData(rankingQuery.data)
  const lastDataPage = useLastData(dataQuery.data)

  const indicators = indicatorsQuery.error ? lastIndicators : indicatorsQuery.data
  const series = seriesQuery.error ? lastSeries : seriesQuery.data
  const breakdown = breakdownQuery.error ? lastBreakdown : breakdownQuery.data
  const ranking = rankingQuery.error ? lastRanking : rankingQuery.data
  const dataPage = dataQuery.error ? lastDataPage : dataQuery.data

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
        indicators,
        indicatorsLoading: indicatorsQuery.isLoading,
        series,
        seriesLoading: seriesQuery.isLoading,
        breakdown,
        breakdownLoading: breakdownQuery.isLoading,
        ranking,
        rankingLoading: rankingQuery.isLoading,
        dataPage,
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

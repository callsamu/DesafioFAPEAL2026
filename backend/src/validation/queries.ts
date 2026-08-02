import { z } from 'zod';
import {
  SchoolNetworkEnum,
  EducationLevelEnum,
  VariableEnum,
} from './enums';
import {
  VARIABLES_BY_SOURCE,
  LEVELS_WITH_PERFORMANCE_RATE,
  PERFORMANCE_RATES,
} from './rows';

const DEMOGRAPHIC_VARIABLES = VARIABLES_BY_SOURCE.censo_demografico;

const filtersSchema = z.object({
  municipality: z.string().optional(),
  year: z.coerce.number().int().optional(),
  startYear: z.coerce.number().int().optional(),
  endYear: z.coerce.number().int().optional(),
  network: SchoolNetworkEnum.optional(),
  level: EducationLevelEnum.optional(),
  variable: VariableEnum.optional(),
});

type FiltersShape = z.infer<typeof filtersSchema>;

function checkPerformanceRateLevel(filters: FiltersShape, ctx: z.RefinementCtx) {
  if (
    filters.variable &&
    PERFORMANCE_RATES.includes(filters.variable) &&
    filters.level &&
    !LEVELS_WITH_PERFORMANCE_RATE.has(filters.level)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['level'],
      message: `"${filters.variable}" não existe para o nível "${filters.level}"`,
    });
  }
}

function checkDemographicRules(filters: FiltersShape, ctx: z.RefinementCtx) {
  const isDemographic = filters.variable !== undefined && DEMOGRAPHIC_VARIABLES.includes(filters.variable);

  if (isDemographic) {
    if (filters.network && filters.network !== 'Não se aplica') {
      ctx.addIssue({
        code: 'custom',
        path: ['network'],
        message: `variável "${filters.variable}" exige rede de ensino "Não se aplica"`,
      });
    }

    if (filters.level && filters.level !== 'Pessoas de 15 anos ou mais de idade') {
      ctx.addIssue({
        code: 'custom',
        path: ['level'],
        message: `variável "${filters.variable}" exige etapa de ensino "Pessoas de 15 anos ou mais de idade"`,
      });
    }
  } else if (filters.network === 'Não se aplica' && filters.variable !== undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['network'],
      message: 'rede de ensino "Não se aplica" só é válida para variáveis de censo_demografico',
    });
  }
}

export const FiltersSchema = filtersSchema.superRefine((filters, ctx) => {
  checkPerformanceRateLevel(filters, ctx);
  checkDemographicRules(filters, ctx);
});

export type Filters = z.infer<typeof FiltersSchema>;

export const VariableFiltersSchema = FiltersSchema.required({
  variable: true,
  level: true,
});

export type VariableFilters = z.infer<typeof VariableFiltersSchema>;

export const PaginationSchema = z.object({
  size: z.coerce.number().int().positive().default(20),
  page: z.coerce.number().int().positive().default(1),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const DataQuerySchema = FiltersSchema.extend(PaginationSchema.shape);

export type DataQuery = z.infer<typeof DataQuerySchema>;

export const RankingQuerySchema = z.object({
  ...VariableFiltersSchema.shape,
  limit: z.coerce.number().int().positive().default(10)
});

export type RankingQuery = z.infer<typeof RankingQuerySchema>;

import { z } from 'zod';
import {
  SchoolNetworkEnum,
  EducationLevelEnum,
  VariableEnum,
} from './enums';

export const FiltersSchema = z.object({
  municipality: z.string().optional(),
  year: z.coerce.number().int().optional(),
  startYear: z.coerce.number().int().optional(),
  endYear: z.coerce.number().int().optional(),
  network: SchoolNetworkEnum.optional(),
  level: EducationLevelEnum.optional(),
  variable: VariableEnum.optional(),
});

export type Filters = z.infer<typeof FiltersSchema>;

export const VariableFiltersSchema = FiltersSchema.required({ 
  variable: true,
  level: true,
});

export type VariableFilters = z.infer<typeof FiltersSchema>;

export const PaginationSchema = z.object({
  size: z.coerce.number().int().positive().default(20),
  page: z.coerce.number().int().positive().default(1),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const DataQuerySchema = FiltersSchema.extend(PaginationSchema.shape);

export type DataQuery = z.infer<typeof DataQuerySchema>;

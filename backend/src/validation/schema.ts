import { z } from 'zod';
import { metricsTable } from '../db/schema';

export const SourceEnum = z.enum([
  'censo_escolar',
  'indicadores_rendimento',
  'censo_demografico',
]);

export const SchoolNetworkEnum = z.enum([
  'Estadual',
  'Municipal',
  'Federal',
  'Privada',
  'Pública',
  'Total',
  'Não se aplica',
]);

export const EducationLevelEnum = z.enum([
  'Educação Infantil',
  'Ensino Fundamental',
  'Ensino Médio',
  'Educação de Jovens e Adultos (EJA)',
  'Educação Profissional',
  'Pessoas de 15 anos ou mais de idade',
]);

export const VariableEnum = z.enum([
  'Escolas',
  'Matrícula',
  'Taxa de Aprovação',
  'Taxa de Reprovação',
  'Taxa de Abandono',
  'Pessoas Alfabetizadas',
  'Pessoas Total',
  'Taxa de Alfabetização',
  'Taxa de Analfabetismo',
]);

const VARIABLES_BY_SOURCE: Record<z.infer<typeof SourceEnum>, string[]> = {
  censo_escolar: ['Escolas', 'Matrícula'],
  indicadores_rendimento: ['Taxa de Aprovação', 'Taxa de Reprovação', 'Taxa de Abandono'],
  censo_demografico: [
    'Pessoas Alfabetizadas',
    'Pessoas Total',
    'Taxa de Alfabetização',
    'Taxa de Analfabetismo',
  ],
};


const LEVELS_WITH_PERFORMANCE_RATE = new Set(['Ensino Fundamental', 'Ensino Médio']);


export const RowSchema = z
  .object({
    co_mun: z
      .string()
      .regex(/^\d{7}$/, 'código do município deve ter exatamente 7 dígitos'),

    no_mun: z.string().min(1, 'nome do município não pode ser vazio'),

    ano: z.coerce
      .number()
      .int('ano deve ser um número inteiro')
      .min(2007, 'ano fora da faixa permitida (2007-2025)')
      .max(2025, 'ano fora da faixa permitida (2007-2025)'),

    fonte: SourceEnum,
    variavel: VariableEnum,
    ensino_rede: SchoolNetworkEnum,
    ensino_tipo: EducationLevelEnum,

    valor: z.coerce
      .number('valor deve ser numérico')
      .nonnegative('valor não pode ser negativo'),
  })
  .superRefine((row, ctx) => {
    if (!VARIABLES_BY_SOURCE[row.fonte].includes(row.variavel)) {
      ctx.addIssue({
        code: 'custom',
        path: ['variable'],
        message: `variável "${row.variavel}" não é válida para a fonte "${row.fonte}"`,
      });
    }

    const performanceRates = ['Taxa de Aprovação', 'Taxa de Reprovação', 'Taxa de Abandono'];
    if (
      performanceRates.includes(row.variavel) &&
      !LEVELS_WITH_PERFORMANCE_RATE.has(row.ensino_tipo)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['educationLevel'],
        message: `"${row.variavel}" não existe para o nível "${row.ensino_tipo}"`,
      });
    }

    if (row.fonte === 'censo_demografico') {
      if (row.ensino_rede!== 'Não se aplica') {
        ctx.addIssue({
          code: "custom",
          path: ['schoolNetwork'],
          message: 'linhas de censo_demografico devem ter rede de ensino = "Não se aplica"',
        });
      }
      if (row.ensino_tipo !== 'Pessoas de 15 anos ou mais de idade') {
        ctx.addIssue({
          code: "custom",
          path: ['educationLevel'],
          message:
            'linhas de censo_demografico devem ter etapa de ensino = "Pessoas de 15 anos ou mais de idade"',
        });
      }
    } else if (row.ensino_rede === 'Não se aplica') {
      ctx.addIssue({
        code: "custom",
        path: ['schoolNetwork'],
        message: 'rede de ensino "Não se aplica" só é válida para a fonte censo_demografico',
      });
    }

    if (row.variavel.startsWith('Taxa de') && (row.valor < 0 || row.valor > 100)) {
      ctx.addIssue({
        code: "custom",
        path: ['value'],
        message: `"${row.variavel}" deve estar entre 0 e 100, recebido ${row.valor}`,
      });
    }
  });

export type Row = z.infer<typeof RowSchema>;

export type MetricsRecord = typeof metricsTable.$inferInsert;

export function rowToRecord(row: Row): MetricsRecord {
  return {
    municipalityCode: row.co_mun,
    municipalityName: row.no_mun,
    year: row.ano,
    source: row.fonte,
    variable: row.variavel,
    schoolNetwork: row.ensino_rede,
    educationLevel: row.ensino_tipo,
    value: row.valor,
  };
}
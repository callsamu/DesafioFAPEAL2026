import { z } from 'zod';

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

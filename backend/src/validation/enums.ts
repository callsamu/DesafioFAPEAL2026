import { z } from 'zod';

function invalidOptionMessage(issue: { values: unknown[] }): string {
  const options = issue.values.map(v => `'${v}'`).join(',');
  return `deve ser ${options}`;
}

export const SourceEnum = z.enum(
  [
    'censo_escolar',
    'indicadores_rendimento',
    'censo_demografico',
  ],
  { error: invalidOptionMessage }
);

export const SchoolNetworkEnum = z.enum(
  [
    'Estadual',
    'Municipal',
    'Federal',
    'Privada',
    'Pública',
    'Total',
    'Não se aplica',
  ],
  { error: invalidOptionMessage }
);

export const EducationLevelEnum = z.enum(
  [
    'Educação Infantil',
    'Ensino Fundamental',
    'Ensino Médio',
    'Educação de Jovens e Adultos (EJA)',
    'Educação Profissional',
    'Pessoas de 15 anos ou mais de idade',
  ],
  { error: invalidOptionMessage }
);

export const VariableEnum = z.enum(
  [
    'Escolas',
    'Matrícula',
    'Taxa de Aprovação',
    'Taxa de Reprovação',
    'Taxa de Abandono',
    'Pessoas Alfabetizadas',
    'Pessoas Total',
    'Taxa de Alfabetização',
    'Taxa de Analfabetismo',
  ],
  { error: invalidOptionMessage }
);

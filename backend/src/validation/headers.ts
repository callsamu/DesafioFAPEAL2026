export const EXPECTED_HEADER = [
  'co_mun',
  'no_mun',
  'ano',
  'fonte',
  'variavel',
  'ensino_rede',
  'ensino_tipo',
  'valor',
] as readonly string[];

export function validateHeader(
    columns: string[]
): { ok: boolean, errors: string[] } {
    const errors: string[] = [];
    const missing = EXPECTED_HEADER.filter((c) => !columns.includes(c));
    const extra = columns.filter((c) => !EXPECTED_HEADER.includes(c));


    if (missing.length > 0) {
        errors.push(`Colunas faltando: ${missing.join(', ')}`);
    }
    if (extra.length > 0) {
        errors.push(`Colunas inesperadas: ${extra.join(', ')}`);
    }

    return { ok: errors.length == 0, errors };
}
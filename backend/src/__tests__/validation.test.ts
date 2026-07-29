import { describe, expect, it } from 'vitest';
import { EXPECTED_HEADER, validateHeader } from '../validation/headers';
import { RowSchema, rowToRecord } from '../validation/schema';


describe('validateHeader', () => {
  it('returns ok when the header matches the expected columns', () => {
    expect(validateHeader([...EXPECTED_HEADER])).toEqual({
      ok: true,
      errors: [],
    });
  });

  it('reports missing columns', () => {
    const columns = EXPECTED_HEADER.filter((c) => c !== 'valor');

    expect(validateHeader(columns)).toEqual({
      ok: false,
      errors: ['Colunas faltando: valor'],
    });
  });

  it('reports both missing and unexpected columns', () => {
    const columns = EXPECTED_HEADER.filter((c) => c !== 'ano').concat('extra');

    expect(validateHeader(columns)).toEqual({
      ok: false,
      errors: [
        'Colunas faltando: ano',
        'Colunas inesperadas: extra',
      ],
    });
  });
});

describe('RowSchema', () => {
  it('validates a correct record', () => {
    const validRow = {
      co_mun: '2704302',
      no_mun: 'Maceió',
      ano: '2023',          
      fonte: 'censo_escolar',
      variavel: 'Matrícula',
      ensino_rede: 'Total',
      ensino_tipo: 'Ensino Fundamental',
      valor: '109026.0',
    };

    const result = RowSchema.safeParse(validRow);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ano).toBe(2023);
      expect(result.data.valor).toBe(109026);

      const camel = rowToRecord(result.data);
      expect(camel).toEqual({
        municipalityCode: '2704302',
        municipalityName: 'Maceió',
        year: 2023,
        source: 'censo_escolar',
        variable: 'Matrícula',
        schoolNetwork: 'Total',
        educationLevel: 'Ensino Fundamental',
        value: 109026,
      });
    }
  });

  it('rejects an invalid record (4.5)', () => {
    const invalidRow = {
      co_mun: '2704302',
      no_mun: 'Maceió',
      ano: '2023',
      fonte: 'indicadores_rendimento',
      variavel: 'Taxa de Abandono',
      ensino_rede: 'Total',
      ensino_tipo: 'Educação Infantil',
      valor: '2.5',
    };

    const result = RowSchema.safeParse(invalidRow);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        `"${invalidRow.variavel}" não existe para o nível "${invalidRow.ensino_tipo}"`
      );
    }
  });
});
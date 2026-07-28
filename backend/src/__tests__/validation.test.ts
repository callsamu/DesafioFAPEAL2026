import { describe, expect, it } from 'vitest';
import { EXPECTED_HEADER, validateHeader } from '../validation/headers';


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
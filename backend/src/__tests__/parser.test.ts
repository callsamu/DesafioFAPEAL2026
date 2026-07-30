import { Readable } from 'node:stream';
import { describe, it, expect, vi } from 'vitest';
import { CSVParser, CSVParseError } from '../parser';
import { RowSchema, MetricsRecord, rowToRecord } from '../validation/schema';

const HEADER = 'co_mun,no_mun,ano,fonte,variavel,ensino_rede,ensino_tipo,valor';
const FIELDS = HEADER.split(',');

function rowToObject(line: string): Record<string, string> {
    const values = line.split(',');
    return Object.fromEntries(FIELDS.map((f, i) => [f, values[i]]));
}

describe('Parser', () => {
    it('parses simple csv excluding invalid records', async () => {
        const rows = [
            '2704302,Maceió,2023,censo_escolar,Matrícula,Estadual,Ensino Fundamental,29270.0',
            '2704302,,2023,censo_escolar,Matrícula,Estadual,Ensino Fundamental,29270.0',
            '2704302,Maceió,1999,censo_escolar,Matrícula,Estadual,Ensino Fundamental,29270.0',
            '2704302,Maceió,2023,invalid_source,Matrícula,Estadual,Ensino Fundamental,29270.0',
            '2704302,Maceió,2023,censo_escolar,InvalidVariable,Estadual,Ensino Fundamental,29270.0',
            '2704302,Maceió,2023,censo_escolar,Matrícula,InvalidNetwork,Ensino Fundamental,29270.0',
            '2704302,Maceió,2023,censo_escolar,Matrícula,Estadual,InvalidLevel,29270.0',
            '2704302,Maceió,2023,censo_escolar,Matrícula,Estadual,Ensino Fundamental,-1.0',
            '2704302,Maceió,2023,censo_escolar,Taxa de Aprovação,Estadual,Educação Infantil,95.0',
            '2704302,Maceió,2023,censo_escolar,Matrícula,Não se aplica,Ensino Fundamental,100.0',
            '2704302,Maceió,2023,censo_demografico,Taxa de Alfabetização,Estadual,Pessoas de 15 anos ou mais de idade,91.4',
            '2704302,Maceió,2023,censo_demografico,Taxa de Alfabetização,Não se aplica,Ensino Fundamental,91.4',
            '2704302,Maceió,2023,indicadores_rendimento,Taxa de Aprovação,Estadual,Ensino Fundamental,150.0',
        ];

        const validRow = rows[0];
        const invalidRows = rows.slice(1);

        for (const line of invalidRows) {
            const obj = rowToObject(line);
            const result = RowSchema.safeParse(obj);
            expect(result.success).toBe(false);
        }

        const validResult = RowSchema.safeParse(rowToObject(validRow));
        expect(validResult.success).toBe(true);

        const csv = [HEADER, ...rows].join('\n');

        const stream = new Readable();
        stream._read = () => {};
        stream.push(csv);
        stream.push(null);

        const batchMock = vi.fn();
        const parser = new CSVParser({
            batchSize: 100,
            onBatch: batchMock,
        });

        const results = await parser.parse(stream);
        expect(results.read).toBe(13);
        expect(results.imported).toBe(1);
        expect(results.rejected).toBe(12);

        expect(batchMock).toHaveBeenCalledTimes(1);
        expect(batchMock).toHaveBeenCalledWith([rowToRecord(validResult.data!)]);
    });

    it('rejects on invalid headers', async () => {
        const csv = 'wrong,header,cols\n1,2,3\n';

        const stream = new Readable();
        stream._read = () => {};
        stream.push(csv);
        stream.push(null);

        const parser = new CSVParser({
            batchSize: 100,
            onBatch: vi.fn(),
        });

        await expect(parser.parse(stream)).rejects.toThrow(CSVParseError);
    });
});
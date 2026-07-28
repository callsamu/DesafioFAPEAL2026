import { Readable } from 'node:stream';
import { describe, it, expect, vi } from 'vitest';
import { Parser } from '../parser';

describe('parser', () => {
    it('parsers simple input', async () => {
        const input = 
            "id, name\n" +
            "1, iuset\n" +
            "2, davila";

        const expected = [
            { id: 1, name: "iuset" },
            { id: 2, name: "davilla"},
        ]

        const stream = new Readable();
        stream._read = () => {};
        stream.push(input);

        const batchMock = vi.fn();
        const doneMock = vi.fn();

        const parser = new Parser({
            stream,
            onBatch: batchMock,
            onDone: doneMock,
        });
        
        vi.waitFor(() => {
            expect(batchMock).toHaveBeenCalledWith(expected);
            expect(doneMock).toHaveBeenCalledWith({ read: 2 });
        });
    });
});

import { Readable } from "node:stream";
import csv from "csv-parser";
import { validateHeader } from "./validation/headers";
import { ReadStream } from "node:fs";
import { MetricsRecord, Row, RowSchema, rowToRecord } from "./validation/schema";
import { assert } from "node:console";

export interface ParseResult {
    read: number;
    imported: number;
    rejected: number;
    errors: Map<number, string>;
}

export interface ParserArgs {
    batchSize: number;
    onBatch(batch: MetricsRecord[]): void;
}

export class CSVParseError extends Error {}

export class CSVParser {
    index = 0;
    rejected = 0;
    errors = new Map<number, string>;

    readonly batchSize: number;

    private records: MetricsRecord[] = [];

    onBatch: ParserArgs["onBatch"];

    constructor({ batchSize, onBatch }: ParserArgs) {
        this.batchSize = batchSize;
        this.onBatch = onBatch;
    }

    async parse(stream: Readable): Promise<ParseResult> {
        this.index = 0;
        this.rejected = 0;
        this.errors = this.errors.size > 0 ? 
            new Map() : this.errors;

        return new Promise<ParseResult>((resolve, reject) => {
            const parser = csv();
            stream.pipe(parser)
                .on('data', this.onData.bind(this))
                .on('headers', headers => {
                    const { ok, errors } = validateHeader(headers);
                    if (!ok) {
                        stream.destroy();
                        stream.unpipe();
                        const error = new CSVParseError(errors[0]);
                        parser.destroy(error);
                    }
                })
                .on('error', error => reject(error))
                .on('end', () => {
                    if (this.index == 0) {
                        const error = new CSVParseError("Sem linhas")

                    }
                    resolve(this.onEnd());
                });
        })
    }

    onData(raw: unknown) {
        assert(this.records.length <= this.batchSize);

        this.index += 1;

        const { data: row, success, error } = RowSchema.safeParse(raw);
        if (!success) {
            this.rejected += 1;
            this.errors.set(this.index, error.message);
            return;
        }

        this.records.push(rowToRecord(row))

        if (this.records.length == this.batchSize) {
            this.sendBatch();
        }
    }

    onEnd(): ParseResult {
        if (this.records.length > 0) {
            this.sendBatch();
        }

        return {
            read: this.index,
            imported: this.index - this.rejected,
            rejected: this.rejected,
            errors: this.errors,
        };
    }

    sendBatch() {
        this.onBatch(this.records);
        this.records = [];
    }
}
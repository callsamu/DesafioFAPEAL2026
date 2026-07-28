import { Readable } from "node:stream";
import csv from "csv-parser";

export interface ParseResult {
    read: number;
}

export interface ParserArgs {
    stream: Readable;
    onBatch(batch: unknown[]): void;
    onDone(result: ParseResult): void;
}


export class Parser {
    count = 0;

    private records: unknown[] = [];

    onDone: ParserArgs["onDone"];
    onBatch: ParserArgs["onBatch"];


    constructor({ stream, onDone, onBatch }: ParserArgs) {
        this.onDone = onDone;
        this.onBatch = onBatch;

        stream.pipe(csv())
            .on('data', this.onRow.bind(this))
            .on('end', this.onEnd.bind(this));
    }

    onRow(raw: unknown) {
        console.log(this.records);
        this.records.push(raw);
    }

    onEnd() {
        this.sendBatch();
        this.onDone({
            read: this.records.length,
        });
    }

    sendBatch() {
        this.onBatch(this.records);
        this.records = [];
    }
}
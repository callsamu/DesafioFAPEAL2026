CREATE TABLE "batches" (
	"id" serial PRIMARY KEY,
	"status" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "metrics" ADD COLUMN "batch_id" integer;--> statement-breakpoint
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_batch_id_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id");
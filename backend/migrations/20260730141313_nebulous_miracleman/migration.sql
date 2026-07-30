CREATE TABLE "metrics" (
	"id" serial PRIMARY KEY,
	"municipalityCode" varchar(7) NOT NULL,
	"municipalityName" text NOT NULL,
	"year" smallint NOT NULL,
	"source" text NOT NULL,
	"variable" text NOT NULL,
	"schoolNetwork" text NOT NULL,
	"educationLevel" text NOT NULL,
	"value" numeric NOT NULL
);
--> statement-breakpoint
CREATE INDEX "aggregates_idx" ON "metrics" ("year","variable","schoolNetwork","educationLevel");
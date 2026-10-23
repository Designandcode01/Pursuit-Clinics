CREATE TABLE "public_rate_limits" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"request_count" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "public_rate_limits_count_positive_ck" CHECK ("public_rate_limits"."request_count" >= 1)
);
--> statement-breakpoint
CREATE INDEX "public_rate_limits_updated_at_idx" ON "public_rate_limits" USING btree ("updated_at");
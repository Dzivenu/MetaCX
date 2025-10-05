CREATE TABLE "float_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"user_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"status" text NOT NULL,
	"source_model_type" text,
	"source_model_id" text,
	"inbound_repository_id" text,
	"outbound_repository_id" text,
	"inbound_ticker" text,
	"outbound_ticker" text,
	"inbound_sum" numeric,
	"outbound_sum" numeric,
	"inbound_balance_before" numeric,
	"inbound_balance_after" numeric,
	"outbound_balance_before" numeric,
	"outbound_balance_after" numeric,
	"float_stacks_data" json DEFAULT '[]'::json
);
--> statement-breakpoint
CREATE TABLE "float_transfers" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"inbound_repository_id" text NOT NULL,
	"outbound_repository_id" text NOT NULL,
	"inbound_ticker" text NOT NULL,
	"outbound_ticker" text NOT NULL,
	"inbound_sum" numeric NOT NULL,
	"outbound_sum" numeric NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "repository_access_logs" DROP CONSTRAINT "repository_access_logs_session_id_cx_session_id_fk";
--> statement-breakpoint
ALTER TABLE "denominations" DROP CONSTRAINT "denominations_currency_id_currencies_id_fk";
--> statement-breakpoint
ALTER TABLE "float_stacks" DROP CONSTRAINT "float_stacks_cx_session_id_cx_session_id_fk";
--> statement-breakpoint
ALTER TABLE "float_stacks" DROP CONSTRAINT "float_stacks_denomination_id_denominations_id_fk";
--> statement-breakpoint
DROP INDEX "index_float_stacks_on_cx_session_id";--> statement-breakpoint
ALTER TABLE "repository_access_logs" ALTER COLUMN "repository_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "repository_access_logs" ALTER COLUMN "repository_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "repository_access_logs" ALTER COLUMN "session_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "denominations" ALTER COLUMN "value" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "denominations" ALTER COLUMN "currency_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "float_stacks" ALTER COLUMN "repository_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "float_stacks" ALTER COLUMN "repository_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "float_stacks" ALTER COLUMN "denomination_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "float_stacks" ALTER COLUMN "ticker" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "repository_access_logs" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "repository_access_logs" ADD COLUMN "open_start_dt" timestamp;--> statement-breakpoint
ALTER TABLE "repository_access_logs" ADD COLUMN "open_confirm_dt" timestamp;--> statement-breakpoint
ALTER TABLE "repository_access_logs" ADD COLUMN "close_start_dt" timestamp;--> statement-breakpoint
ALTER TABLE "repository_access_logs" ADD COLUMN "close_confirm_dt" timestamp;--> statement-breakpoint
ALTER TABLE "repository_access_logs" ADD COLUMN "release_dt" timestamp;--> statement-breakpoint
ALTER TABLE "repository_access_logs" ADD COLUMN "authorized_users" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "denominations" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "float_stacks" ADD COLUMN "session_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "float_stacks" ADD COLUMN "midday_count" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "float_stacks" ADD COLUMN "last_session_count" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "float_stacks" ADD COLUMN "open_confirmed_dt" timestamp;--> statement-breakpoint
ALTER TABLE "float_stacks" ADD COLUMN "close_confirmed_dt" timestamp;--> statement-breakpoint
ALTER TABLE "float_stacks" ADD COLUMN "spent_during_session" numeric DEFAULT '0.0';--> statement-breakpoint
ALTER TABLE "float_stacks" ADD COLUMN "transferred_during_session" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "float_stacks" ADD COLUMN "average_spot" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "float_stacks" ADD COLUMN "previous_session_float_stack_id" text;--> statement-breakpoint
ALTER TABLE "float_snapshots" ADD CONSTRAINT "float_snapshots_session_id_cx_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cx_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_snapshots" ADD CONSTRAINT "float_snapshots_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_snapshots" ADD CONSTRAINT "float_snapshots_inbound_repository_id_repositories_id_fk" FOREIGN KEY ("inbound_repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_snapshots" ADD CONSTRAINT "float_snapshots_outbound_repository_id_repositories_id_fk" FOREIGN KEY ("outbound_repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_transfers" ADD CONSTRAINT "float_transfers_session_id_cx_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cx_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_transfers" ADD CONSTRAINT "float_transfers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_transfers" ADD CONSTRAINT "float_transfers_inbound_repository_id_repositories_id_fk" FOREIGN KEY ("inbound_repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_transfers" ADD CONSTRAINT "float_transfers_outbound_repository_id_repositories_id_fk" FOREIGN KEY ("outbound_repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "index_float_snapshots_on_session_id" ON "float_snapshots" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "index_float_snapshots_on_status" ON "float_snapshots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "index_float_snapshots_on_source_model" ON "float_snapshots" USING btree ("source_model_type","source_model_id");--> statement-breakpoint
CREATE INDEX "index_float_transfers_on_session_id" ON "float_transfers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "index_float_transfers_on_inbound_repository_id" ON "float_transfers" USING btree ("inbound_repository_id");--> statement-breakpoint
CREATE INDEX "index_float_transfers_on_outbound_repository_id" ON "float_transfers" USING btree ("outbound_repository_id");--> statement-breakpoint
CREATE INDEX "index_float_transfers_on_status" ON "float_transfers" USING btree ("status");--> statement-breakpoint
ALTER TABLE "repository_access_logs" ADD CONSTRAINT "repository_access_logs_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_access_logs" ADD CONSTRAINT "repository_access_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_access_logs" ADD CONSTRAINT "repository_access_logs_session_id_cx_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cx_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denominations" ADD CONSTRAINT "denominations_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_stacks" ADD CONSTRAINT "float_stacks_session_id_cx_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cx_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_stacks" ADD CONSTRAINT "float_stacks_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_stacks" ADD CONSTRAINT "float_stacks_denomination_id_denominations_id_fk" FOREIGN KEY ("denomination_id") REFERENCES "public"."denominations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "index_repository_access_logs_on_user_id" ON "repository_access_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "index_float_stacks_on_session_id" ON "float_stacks" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "index_float_stacks_on_ticker" ON "float_stacks" USING btree ("ticker");--> statement-breakpoint
ALTER TABLE "repository_access_logs" DROP COLUMN "possession_at";--> statement-breakpoint
ALTER TABLE "repository_access_logs" DROP COLUMN "release_at";--> statement-breakpoint
ALTER TABLE "repository_access_logs" DROP COLUMN "open_start_at";--> statement-breakpoint
ALTER TABLE "repository_access_logs" DROP COLUMN "open_confirm_at";--> statement-breakpoint
ALTER TABLE "repository_access_logs" DROP COLUMN "close_start_at";--> statement-breakpoint
ALTER TABLE "repository_access_logs" DROP COLUMN "close_confirm_at";--> statement-breakpoint
ALTER TABLE "repository_access_logs" DROP COLUMN "open_start_user_id";--> statement-breakpoint
ALTER TABLE "repository_access_logs" DROP COLUMN "open_confirm_user_id";--> statement-breakpoint
ALTER TABLE "repository_access_logs" DROP COLUMN "close_start_user_id";--> statement-breakpoint
ALTER TABLE "repository_access_logs" DROP COLUMN "close_confirm_user_id";--> statement-breakpoint
ALTER TABLE "float_stacks" DROP COLUMN "open_confirmed_at";--> statement-breakpoint
ALTER TABLE "float_stacks" DROP COLUMN "cx_session_id";--> statement-breakpoint
ALTER TABLE "float_stacks" DROP COLUMN "spent_during_cx_session";--> statement-breakpoint
ALTER TABLE "float_stacks" DROP COLUMN "close_confirmed_at";--> statement-breakpoint
ALTER TABLE "float_stacks" DROP COLUMN "last_cx_session_count";--> statement-breakpoint
ALTER TABLE "float_stacks" DROP COLUMN "previous_cx_session_float_stack_id";--> statement-breakpoint
ALTER TABLE "float_stacks" DROP COLUMN "transferred_during_cx_session";
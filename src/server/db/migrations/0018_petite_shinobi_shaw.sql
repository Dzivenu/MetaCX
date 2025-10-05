CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"inbound_sum" numeric,
	"inbound_ticker" text,
	"inbound_type" text,
	"outbound_sum" numeric,
	"outbound_ticker" text,
	"outbound_type" text,
	"fx_rate" real,
	"rate_wo_fees" real,
	"final_rate" real,
	"final_rate_without_fees" real,
	"margin" real,
	"fee" real,
	"network_fee" real DEFAULT 0,
	"status" text,
	"session_id" text,
	"user_id" text,
	"inbound_repository_id" text,
	"outbound_repository_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"open_dt" timestamp,
	"close_dt" timestamp,
	"btc_fee_rate" text,
	"quote_source" text,
	"quote_source_user_id" text,
	"batched_status" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "breakdowns" ALTER COLUMN "breakable_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_session_id_cx_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cx_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_inbound_repository_id_repositories_id_fk" FOREIGN KEY ("inbound_repository_id") REFERENCES "public"."repositories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_outbound_repository_id_repositories_id_fk" FOREIGN KEY ("outbound_repository_id") REFERENCES "public"."repositories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "index_orders_on_session_id" ON "orders" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "index_orders_on_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "index_orders_on_inbound_sum" ON "orders" USING btree ("inbound_sum");--> statement-breakpoint
CREATE INDEX "index_orders_on_outbound_sum" ON "orders" USING btree ("outbound_sum");--> statement-breakpoint
CREATE INDEX "index_orders_on_user_id" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "index_orders_on_inbound_repository_id" ON "orders" USING btree ("inbound_repository_id");--> statement-breakpoint
CREATE INDEX "index_orders_on_outbound_repository_id" ON "orders" USING btree ("outbound_repository_id");
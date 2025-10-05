CREATE TABLE "repositories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type_of" text,
	"organization_id" bigint,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"currency_type" text,
	"form" text,
	"uid" integer,
	"key" text NOT NULL,
	"currency_tickers" text[] DEFAULT '{}',
	"display_order_id" integer,
	"float_threshold_bottom" numeric,
	"float_threshold_top" numeric,
	"float_count_required" boolean,
	"active" boolean DEFAULT true,
	CONSTRAINT "repositories_key_unique" UNIQUE("key"),
	CONSTRAINT "repositories_org_name_unique" UNIQUE("organization_id","name")
);
--> statement-breakpoint
CREATE TABLE "repository_access_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"repository_id" bigint,
	"session_id" text,
	"possession_at" timestamp,
	"release_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"open_start_at" timestamp,
	"open_confirm_at" timestamp,
	"close_start_at" timestamp,
	"close_confirm_at" timestamp,
	"open_start_user_id" bigint,
	"open_confirm_user_id" bigint,
	"close_start_user_id" bigint,
	"close_confirm_user_id" bigint
);
--> statement-breakpoint
ALTER TABLE "repository_access_logs" ADD CONSTRAINT "repository_access_logs_session_id_cx_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cx_session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "index_repositories_on_name" ON "repositories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "index_repositories_on_key" ON "repositories" USING btree ("key");--> statement-breakpoint
CREATE INDEX "index_repository_access_logs_on_repository_id" ON "repository_access_logs" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "index_repository_access_logs_on_session_id" ON "repository_access_logs" USING btree ("session_id");
CREATE TABLE "cx_session" (
	"id" text PRIMARY KEY NOT NULL,
	"open_start_dt" timestamp,
	"open_confirm_dt" timestamp,
	"close_start_dt" timestamp,
	"close_confirm_dt" timestamp,
	"user_id" bigint,
	"organization_id" bigint,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"status" text,
	"verified_by_user_id" integer,
	"verified_dt" timestamp,
	"open_start_user_id" bigint,
	"open_confirm_user_id" bigint,
	"close_start_user_id" bigint,
	"close_confirm_user_id" bigint
);
--> statement-breakpoint
DROP TABLE "team" CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" DROP COLUMN "team_id";--> statement-breakpoint
ALTER TABLE "member" DROP COLUMN "team_id";
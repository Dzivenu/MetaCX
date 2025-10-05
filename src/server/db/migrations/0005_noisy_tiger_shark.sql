CREATE TABLE "cx_session_access_log" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"start_dt" timestamp NOT NULL,
	"start_owner_id" text NOT NULL,
	"user_join_dt" timestamp,
	"user_join_id" text,
	"authorized_users" json DEFAULT '[]'::json,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cx_session" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "cx_session" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cx_session" ALTER COLUMN "organization_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "cx_session" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cx_session" ALTER COLUMN "status" SET DEFAULT 'DORMANT';--> statement-breakpoint
ALTER TABLE "cx_session" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cx_session" ALTER COLUMN "verified_by_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "cx_session" ALTER COLUMN "open_start_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "cx_session" ALTER COLUMN "open_confirm_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "cx_session" ALTER COLUMN "close_start_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "cx_session" ALTER COLUMN "close_confirm_user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "active_cx_session_id" text;--> statement-breakpoint
ALTER TABLE "cx_session" ADD COLUMN "active_user_id" text;--> statement-breakpoint
ALTER TABLE "cx_session" ADD COLUMN "authorized_user_ids" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "cx_session_access_log" ADD CONSTRAINT "cx_session_access_log_session_id_cx_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cx_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cx_session_access_log" ADD CONSTRAINT "cx_session_access_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cx_session_access_log" ADD CONSTRAINT "cx_session_access_log_start_owner_id_user_id_fk" FOREIGN KEY ("start_owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cx_session_access_log" ADD CONSTRAINT "cx_session_access_log_user_join_id_user_id_fk" FOREIGN KEY ("user_join_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cx_session" ADD CONSTRAINT "cx_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cx_session" ADD CONSTRAINT "cx_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cx_session" ADD CONSTRAINT "cx_session_verified_by_user_id_user_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cx_session" ADD CONSTRAINT "cx_session_open_start_user_id_user_id_fk" FOREIGN KEY ("open_start_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cx_session" ADD CONSTRAINT "cx_session_open_confirm_user_id_user_id_fk" FOREIGN KEY ("open_confirm_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cx_session" ADD CONSTRAINT "cx_session_close_start_user_id_user_id_fk" FOREIGN KEY ("close_start_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cx_session" ADD CONSTRAINT "cx_session_close_confirm_user_id_user_id_fk" FOREIGN KEY ("close_confirm_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cx_session" ADD CONSTRAINT "cx_session_active_user_id_user_id_fk" FOREIGN KEY ("active_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
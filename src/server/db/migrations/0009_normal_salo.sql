CREATE TABLE "activity" (
	"id" text PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"session_id" text,
	"reference_id" text,
	"comment" text,
	"meta" json,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "currencies" ALTER COLUMN "organization_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_session_id_cx_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cx_session"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "typeof" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_sign_in_at" timestamp;
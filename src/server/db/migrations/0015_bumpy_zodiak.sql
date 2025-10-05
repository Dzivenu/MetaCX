ALTER TABLE "repositories" ADD COLUMN "authorized_user_ids" text;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "authorized_repo_ids";
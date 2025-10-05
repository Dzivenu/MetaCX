-- Change repositories.organization_id from bigint to text to match UUID format
ALTER TABLE "repositories" ALTER COLUMN "organization_id" SET DATA TYPE text USING organization_id::text;

-- Add foreign key constraint to organization table
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;

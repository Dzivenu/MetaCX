CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"dob" date,
	"occupation" text,
	"employer" text,
	"info" text,
	"scan_success" boolean DEFAULT false NOT NULL,
	"scan_raw_data" text,
	"telephone" text,
	"email" text,
	"duplicate" boolean DEFAULT false NOT NULL,
	"merged_id" text,
	"orders_between_1k_to_9k" integer DEFAULT 0,
	"orders_between_9k_to_10k" integer DEFAULT 0,
	"last_order_id" text DEFAULT '0',
	"suspicious_order" boolean,
	"previous_ids" text[] DEFAULT '{}',
	"marketable_contact_ids" text[] DEFAULT '{}',
	"primary_phone_id" text,
	"primary_email_id" text,
	"primary_address_id" text,
	"primary_identification_id" text,
	"risk_score" numeric,
	"last_order_dt" timestamp,
	"orders_over_10k" integer DEFAULT 0,
	"blacklist_reason" text,
	"active" boolean DEFAULT true NOT NULL,
	"blacklisted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"parent_type" text NOT NULL,
	"parent_id" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"country_code" text DEFAULT 'US' NOT NULL,
	"primary" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"address_full" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"parent_type" text NOT NULL,
	"parent_id" text NOT NULL,
	"type_of" text NOT NULL,
	"endpoint" text NOT NULL,
	"extension" text,
	"primary" boolean DEFAULT false NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"marketable" boolean,
	"marketable_accept_dt" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"reviewer_id" text
);
--> statement-breakpoint
CREATE TABLE "identifications" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"address_id" text,
	"type_of" text NOT NULL,
	"reference_number" text NOT NULL,
	"issuing_country_code" text,
	"issue_date" date,
	"expiry_date" date,
	"photo" text,
	"date_of_birth" date,
	"origin_of_funds" text,
	"purpose_of_funds" text,
	"description" text,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"reviewer_id" text,
	"primary" boolean DEFAULT false NOT NULL,
	"type_code" text,
	"country_code" text,
	"province_code" text,
	"province_other" text,
	"active" boolean DEFAULT true NOT NULL,
	"order_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identifications" ADD CONSTRAINT "identifications_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identifications" ADD CONSTRAINT "identifications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identifications" ADD CONSTRAINT "identifications_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identifications" ADD CONSTRAINT "identifications_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "index_customers_on_organization_id" ON "customers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "index_customers_on_last_first_name" ON "customers" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE INDEX "index_customers_on_first_name" ON "customers" USING btree ("first_name");--> statement-breakpoint
CREATE INDEX "index_customers_on_last_name" ON "customers" USING btree ("last_name");--> statement-breakpoint
CREATE INDEX "index_customers_on_merged_id" ON "customers" USING btree ("merged_id");--> statement-breakpoint
CREATE INDEX "index_customers_on_risk_score" ON "customers" USING btree ("risk_score");--> statement-breakpoint
CREATE INDEX "index_addresses_on_organization_id" ON "addresses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "index_addresses_on_parent" ON "addresses" USING btree ("parent_type","parent_id");--> statement-breakpoint
CREATE INDEX "index_addresses_on_city" ON "addresses" USING btree ("city");--> statement-breakpoint
CREATE INDEX "index_addresses_on_postal_code" ON "addresses" USING btree ("postal_code");--> statement-breakpoint
CREATE INDEX "index_contacts_on_organization_id" ON "contacts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "index_contacts_on_parent" ON "contacts" USING btree ("parent_type","parent_id");--> statement-breakpoint
CREATE INDEX "index_contacts_on_type_of" ON "contacts" USING btree ("type_of");--> statement-breakpoint
CREATE INDEX "index_identifications_on_organization_id" ON "identifications" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "index_identifications_on_customer_id" ON "identifications" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "index_identifications_on_address_id" ON "identifications" USING btree ("address_id");--> statement-breakpoint
CREATE INDEX "index_identifications_on_type_of" ON "identifications" USING btree ("type_of");--> statement-breakpoint
CREATE INDEX "index_identifications_on_reference_number" ON "identifications" USING btree ("reference_number");--> statement-breakpoint
CREATE INDEX "index_identifications_on_active" ON "identifications" USING btree ("active");--> statement-breakpoint
CREATE INDEX "index_identifications_on_primary" ON "identifications" USING btree ("primary");
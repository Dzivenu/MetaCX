CREATE TABLE "denominations" (
	"id" text PRIMARY KEY NOT NULL,
	"value" real,
	"currency_id" bigint,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"accepted" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "float_stacks" (
	"id" text PRIMARY KEY NOT NULL,
	"open_confirmed_at" timestamp,
	"open_count" real DEFAULT 0,
	"cx_session_id" text,
	"repository_id" bigint,
	"denomination_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"spent_during_cx_session" numeric DEFAULT '0.0',
	"close_confirmed_at" timestamp,
	"close_count" real DEFAULT 0,
	"last_cx_session_count" real DEFAULT 0,
	"previous_cx_session_float_stack_id" integer,
	"denominated_value" real DEFAULT 0,
	"ticker" text,
	"open_spot" real DEFAULT 0,
	"close_spot" real DEFAULT 0,
	"transferred_during_cx_session" real DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "breakdowns" (
	"id" text PRIMARY KEY NOT NULL,
	"breakable_type" text,
	"breakable_id" bigint,
	"denomination_id" text,
	"count" numeric,
	"direction" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"float_stack_id" text,
	"status" text
);
--> statement-breakpoint
ALTER TABLE "float_stacks" ADD CONSTRAINT "float_stacks_cx_session_id_cx_session_id_fk" FOREIGN KEY ("cx_session_id") REFERENCES "public"."cx_session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "float_stacks" ADD CONSTRAINT "float_stacks_denomination_id_denominations_id_fk" FOREIGN KEY ("denomination_id") REFERENCES "public"."denominations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breakdowns" ADD CONSTRAINT "breakdowns_denomination_id_denominations_id_fk" FOREIGN KEY ("denomination_id") REFERENCES "public"."denominations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breakdowns" ADD CONSTRAINT "breakdowns_float_stack_id_float_stacks_id_fk" FOREIGN KEY ("float_stack_id") REFERENCES "public"."float_stacks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "index_denominations_on_currency_id" ON "denominations" USING btree ("currency_id");--> statement-breakpoint
CREATE INDEX "index_float_stacks_on_denomination_id" ON "float_stacks" USING btree ("denomination_id");--> statement-breakpoint
CREATE INDEX "index_float_stacks_on_repository_id" ON "float_stacks" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "index_float_stacks_on_cx_session_id" ON "float_stacks" USING btree ("cx_session_id");--> statement-breakpoint
CREATE INDEX "index_breakdowns_on_breakable_type_and_breakable_id" ON "breakdowns" USING btree ("breakable_type","breakable_id");--> statement-breakpoint
CREATE INDEX "index_breakdowns_on_denomination_id" ON "breakdowns" USING btree ("denomination_id");--> statement-breakpoint
CREATE INDEX "index_breakdowns_on_float_stack_id" ON "breakdowns" USING btree ("float_stack_id");
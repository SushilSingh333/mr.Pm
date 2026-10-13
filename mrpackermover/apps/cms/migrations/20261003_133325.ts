import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "home_content_page_trust" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "home_content_page_promises" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"link_label" varchar,
  	"link_href" varchar
  );
  
  CREATE TABLE "home_content_page_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "home_content_page_compare" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"them" varchar NOT NULL,
  	"us" varchar NOT NULL
  );
  
  CREATE TABLE "home_content_page_packing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL,
  	"how" varchar NOT NULL
  );
  
  CREATE TABLE "home_content_page_charges_factors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "home_content_page_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"link_label" varchar,
  	"link_href" varchar
  );
  
  CREATE TABLE "services_page_trust" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "services_page_chooser" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"situation" varchar NOT NULL
  );
  
  CREATE TABLE "services_page_standards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"lead" varchar NOT NULL,
  	"rest" varchar NOT NULL,
  	"link_label" varchar,
  	"link_href" varchar
  );
  
  CREATE TABLE "services_page_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"link_label" varchar,
  	"link_href" varchar
  );
  
  CREATE TABLE "services_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"h1" varchar,
  	"intro" varchar,
  	"cards_heading" varchar,
  	"chooser_heading" varchar,
  	"chooser_note_lead" varchar,
  	"chooser_note_link" varchar,
  	"chooser_note_tail" varchar,
  	"standards_heading" varchar,
  	"standards_intro" varchar,
  	"combine_heading" varchar,
  	"combine_text" varchar,
  	"combine_button" varchar,
  	"faq_heading" varchar,
  	"closing_heading" varchar,
  	"closing_text" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "services_page_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer
  );
  
  ALTER TABLE "home_content_pillars" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "home_content_pillars" ALTER COLUMN "body" DROP NOT NULL;
  ALTER TABLE "services" ADD COLUMN "card_h1" varchar;
  ALTER TABLE "services" ADD COLUMN "card_lines" varchar;
  ALTER TABLE "services" ADD COLUMN "card_best_for" varchar;
  ALTER TABLE "services" ADD COLUMN "card_home_line" varchar;
  ALTER TABLE "services" ADD COLUMN "card_link_text" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_card_h1" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_card_lines" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_card_best_for" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_card_home_line" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_card_link_text" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_tagline" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_h1" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_subhead" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_promises_heading" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_steps_heading" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_compare_heading" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_night_heading" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_night_text" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_packing_heading" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_charges_heading" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_charges_intro" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_charges_included" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_charges_promise" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_services_heading" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_cities_heading" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_cities_intro" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_faq_heading" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_closing_heading" varchar;
  ALTER TABLE "home_content" ADD COLUMN "page_closing_text" varchar;
  ALTER TABLE "home_content_page_trust" ADD CONSTRAINT "home_content_page_trust_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_page_promises" ADD CONSTRAINT "home_content_page_promises_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_page_steps" ADD CONSTRAINT "home_content_page_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_page_compare" ADD CONSTRAINT "home_content_page_compare_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_page_packing" ADD CONSTRAINT "home_content_page_packing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_page_charges_factors" ADD CONSTRAINT "home_content_page_charges_factors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_page_faqs" ADD CONSTRAINT "home_content_page_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_page_trust" ADD CONSTRAINT "services_page_trust_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_page_chooser" ADD CONSTRAINT "services_page_chooser_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_page_standards" ADD CONSTRAINT "services_page_standards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_page_faqs" ADD CONSTRAINT "services_page_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_page_rels" ADD CONSTRAINT "services_page_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_page_rels" ADD CONSTRAINT "services_page_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_content_page_trust_order_idx" ON "home_content_page_trust" USING btree ("_order");
  CREATE INDEX "home_content_page_trust_parent_id_idx" ON "home_content_page_trust" USING btree ("_parent_id");
  CREATE INDEX "home_content_page_promises_order_idx" ON "home_content_page_promises" USING btree ("_order");
  CREATE INDEX "home_content_page_promises_parent_id_idx" ON "home_content_page_promises" USING btree ("_parent_id");
  CREATE INDEX "home_content_page_steps_order_idx" ON "home_content_page_steps" USING btree ("_order");
  CREATE INDEX "home_content_page_steps_parent_id_idx" ON "home_content_page_steps" USING btree ("_parent_id");
  CREATE INDEX "home_content_page_compare_order_idx" ON "home_content_page_compare" USING btree ("_order");
  CREATE INDEX "home_content_page_compare_parent_id_idx" ON "home_content_page_compare" USING btree ("_parent_id");
  CREATE INDEX "home_content_page_packing_order_idx" ON "home_content_page_packing" USING btree ("_order");
  CREATE INDEX "home_content_page_packing_parent_id_idx" ON "home_content_page_packing" USING btree ("_parent_id");
  CREATE INDEX "home_content_page_charges_factors_order_idx" ON "home_content_page_charges_factors" USING btree ("_order");
  CREATE INDEX "home_content_page_charges_factors_parent_id_idx" ON "home_content_page_charges_factors" USING btree ("_parent_id");
  CREATE INDEX "home_content_page_faqs_order_idx" ON "home_content_page_faqs" USING btree ("_order");
  CREATE INDEX "home_content_page_faqs_parent_id_idx" ON "home_content_page_faqs" USING btree ("_parent_id");
  CREATE INDEX "services_page_trust_order_idx" ON "services_page_trust" USING btree ("_order");
  CREATE INDEX "services_page_trust_parent_id_idx" ON "services_page_trust" USING btree ("_parent_id");
  CREATE INDEX "services_page_chooser_order_idx" ON "services_page_chooser" USING btree ("_order");
  CREATE INDEX "services_page_chooser_parent_id_idx" ON "services_page_chooser" USING btree ("_parent_id");
  CREATE INDEX "services_page_standards_order_idx" ON "services_page_standards" USING btree ("_order");
  CREATE INDEX "services_page_standards_parent_id_idx" ON "services_page_standards" USING btree ("_parent_id");
  CREATE INDEX "services_page_faqs_order_idx" ON "services_page_faqs" USING btree ("_order");
  CREATE INDEX "services_page_faqs_parent_id_idx" ON "services_page_faqs" USING btree ("_parent_id");
  CREATE INDEX "services_page_rels_order_idx" ON "services_page_rels" USING btree ("order");
  CREATE INDEX "services_page_rels_parent_idx" ON "services_page_rels" USING btree ("parent_id");
  CREATE INDEX "services_page_rels_path_idx" ON "services_page_rels" USING btree ("path");
  CREATE INDEX "services_page_rels_services_id_idx" ON "services_page_rels" USING btree ("services_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_content_page_trust" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_page_promises" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_page_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_page_compare" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_page_packing" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_page_charges_factors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_page_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_page_trust" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_page_chooser" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_page_standards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_page_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_page_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "home_content_page_trust" CASCADE;
  DROP TABLE "home_content_page_promises" CASCADE;
  DROP TABLE "home_content_page_steps" CASCADE;
  DROP TABLE "home_content_page_compare" CASCADE;
  DROP TABLE "home_content_page_packing" CASCADE;
  DROP TABLE "home_content_page_charges_factors" CASCADE;
  DROP TABLE "home_content_page_faqs" CASCADE;
  DROP TABLE "services_page_trust" CASCADE;
  DROP TABLE "services_page_chooser" CASCADE;
  DROP TABLE "services_page_standards" CASCADE;
  DROP TABLE "services_page_faqs" CASCADE;
  DROP TABLE "services_page" CASCADE;
  DROP TABLE "services_page_rels" CASCADE;
  ALTER TABLE "home_content_pillars" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "home_content_pillars" ALTER COLUMN "body" SET NOT NULL;
  ALTER TABLE "services" DROP COLUMN "card_h1";
  ALTER TABLE "services" DROP COLUMN "card_lines";
  ALTER TABLE "services" DROP COLUMN "card_best_for";
  ALTER TABLE "services" DROP COLUMN "card_home_line";
  ALTER TABLE "services" DROP COLUMN "card_link_text";
  ALTER TABLE "_services_v" DROP COLUMN "version_card_h1";
  ALTER TABLE "_services_v" DROP COLUMN "version_card_lines";
  ALTER TABLE "_services_v" DROP COLUMN "version_card_best_for";
  ALTER TABLE "_services_v" DROP COLUMN "version_card_home_line";
  ALTER TABLE "_services_v" DROP COLUMN "version_card_link_text";
  ALTER TABLE "home_content" DROP COLUMN "page_tagline";
  ALTER TABLE "home_content" DROP COLUMN "page_h1";
  ALTER TABLE "home_content" DROP COLUMN "page_subhead";
  ALTER TABLE "home_content" DROP COLUMN "page_promises_heading";
  ALTER TABLE "home_content" DROP COLUMN "page_steps_heading";
  ALTER TABLE "home_content" DROP COLUMN "page_compare_heading";
  ALTER TABLE "home_content" DROP COLUMN "page_night_heading";
  ALTER TABLE "home_content" DROP COLUMN "page_night_text";
  ALTER TABLE "home_content" DROP COLUMN "page_packing_heading";
  ALTER TABLE "home_content" DROP COLUMN "page_charges_heading";
  ALTER TABLE "home_content" DROP COLUMN "page_charges_intro";
  ALTER TABLE "home_content" DROP COLUMN "page_charges_included";
  ALTER TABLE "home_content" DROP COLUMN "page_charges_promise";
  ALTER TABLE "home_content" DROP COLUMN "page_services_heading";
  ALTER TABLE "home_content" DROP COLUMN "page_cities_heading";
  ALTER TABLE "home_content" DROP COLUMN "page_cities_intro";
  ALTER TABLE "home_content" DROP COLUMN "page_faq_heading";
  ALTER TABLE "home_content" DROP COLUMN "page_closing_heading";
  ALTER TABLE "home_content" DROP COLUMN "page_closing_text";`)
}

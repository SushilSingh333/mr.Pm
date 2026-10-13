import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_proposals_inventory_pack" AS ENUM('Standard Wrap', 'Bubble Wrap', 'Wooden Crate', 'Original Box', 'Blanket Wrap');
  CREATE TYPE "public"."enum_proposals_status" AS ENUM('draft', 'sent', 'accepted', 'lost');
  CREATE TYPE "public"."enum_proposals_move_house" AS ENUM('10 ft', '12 ft', '14 ft', '15 ft', '16 ft', '17 ft', '19 ft');
  CREATE TYPE "public"."enum_proposals_move_svc" AS ENUM('Domestic Household', 'Local / Within City', 'Office / Commercial', 'Vehicle Transport', 'International');
  CREATE TABLE "proposals_inventory" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"qty" numeric DEFAULT 1,
  	"pack" "enum_proposals_inventory_pack" DEFAULT 'Standard Wrap',
  	"rem" varchar
  );
  
  CREATE TABLE "proposals_charges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"amt" numeric
  );
  
  CREATE TABLE "proposals_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line" varchar
  );
  
  CREATE TABLE "proposals_terms" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"line" varchar
  );
  
  CREATE TABLE "proposals" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_proposals_status" DEFAULT 'draft' NOT NULL,
  	"quote_no" varchar,
  	"lead_id" integer,
  	"title" varchar,
  	"client_name" varchar,
  	"route" varchar,
  	"amount" numeric,
  	"customer_name" varchar,
  	"customer_phone" varchar,
  	"customer_email" varchar,
  	"move_from" varchar,
  	"move_froms" varchar,
  	"move_to" varchar,
  	"move_tos" varchar,
  	"move_date" timestamp(3) with time zone,
  	"move_house" "enum_proposals_move_house" DEFAULT '14 ft',
  	"move_dist" varchar,
  	"move_svc" "enum_proposals_move_svc" DEFAULT 'Domestic Household',
  	"pricing_gst_rate" numeric DEFAULT 18,
  	"pricing_goods_value" numeric,
  	"pricing_ins_rate" numeric DEFAULT 0.3,
  	"pricing_valid_days" numeric DEFAULT 15,
  	"pricing_pay" varchar DEFAULT '25% advance · balance before unloading',
  	"company_name" varchar DEFAULT 'MrPackerMover',
  	"company_tag" varchar DEFAULT 'Trusted Household & Office Relocation',
  	"company_phone" varchar DEFAULT '+91 99104 26834',
  	"company_mobile" varchar,
  	"company_email" varchar DEFAULT 'mrmoverpacker25@gmail.com',
  	"company_web" varchar DEFAULT 'mrpackermover.com',
  	"company_addr" varchar,
  	"company_gst" varchar,
  	"company_rep" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "proposals_id" integer;
  ALTER TABLE "proposals_inventory" ADD CONSTRAINT "proposals_inventory_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "proposals_charges" ADD CONSTRAINT "proposals_charges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "proposals_services" ADD CONSTRAINT "proposals_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "proposals_terms" ADD CONSTRAINT "proposals_terms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "proposals" ADD CONSTRAINT "proposals_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "proposals_inventory_order_idx" ON "proposals_inventory" USING btree ("_order");
  CREATE INDEX "proposals_inventory_parent_id_idx" ON "proposals_inventory" USING btree ("_parent_id");
  CREATE INDEX "proposals_charges_order_idx" ON "proposals_charges" USING btree ("_order");
  CREATE INDEX "proposals_charges_parent_id_idx" ON "proposals_charges" USING btree ("_parent_id");
  CREATE INDEX "proposals_services_order_idx" ON "proposals_services" USING btree ("_order");
  CREATE INDEX "proposals_services_parent_id_idx" ON "proposals_services" USING btree ("_parent_id");
  CREATE INDEX "proposals_terms_order_idx" ON "proposals_terms" USING btree ("_order");
  CREATE INDEX "proposals_terms_parent_id_idx" ON "proposals_terms" USING btree ("_parent_id");
  CREATE INDEX "proposals_lead_idx" ON "proposals" USING btree ("lead_id");
  CREATE INDEX "proposals_updated_at_idx" ON "proposals" USING btree ("updated_at");
  CREATE INDEX "proposals_created_at_idx" ON "proposals" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_proposals_fk" FOREIGN KEY ("proposals_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_proposals_id_idx" ON "payload_locked_documents_rels" USING btree ("proposals_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "proposals_inventory" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "proposals_charges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "proposals_services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "proposals_terms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "proposals" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "proposals_inventory" CASCADE;
  DROP TABLE "proposals_charges" CASCADE;
  DROP TABLE "proposals_services" CASCADE;
  DROP TABLE "proposals_terms" CASCADE;
  DROP TABLE "proposals" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_proposals_fk";
  
  DROP INDEX "payload_locked_documents_rels_proposals_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "proposals_id";
  DROP TYPE "public"."enum_proposals_inventory_pack";
  DROP TYPE "public"."enum_proposals_status";
  DROP TYPE "public"."enum_proposals_move_house";
  DROP TYPE "public"."enum_proposals_move_svc";`)
}

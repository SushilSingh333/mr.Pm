import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "lead_routing" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"auto_assign" boolean DEFAULT false,
  	"last_assigned_to_id" integer,
  	"assigned_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "lead_routing_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  ALTER TABLE "proposals" ALTER COLUMN "company_phone" SET DEFAULT '+91 80903 43030';
  ALTER TABLE "lead_routing" ADD CONSTRAINT "lead_routing_last_assigned_to_id_users_id_fk" FOREIGN KEY ("last_assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lead_routing_rels" ADD CONSTRAINT "lead_routing_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lead_routing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lead_routing_rels" ADD CONSTRAINT "lead_routing_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lead_routing_last_assigned_to_idx" ON "lead_routing" USING btree ("last_assigned_to_id");
  CREATE INDEX "lead_routing_rels_order_idx" ON "lead_routing_rels" USING btree ("order");
  CREATE INDEX "lead_routing_rels_parent_idx" ON "lead_routing_rels" USING btree ("parent_id");
  CREATE INDEX "lead_routing_rels_path_idx" ON "lead_routing_rels" USING btree ("path");
  CREATE INDEX "lead_routing_rels_users_id_idx" ON "lead_routing_rels" USING btree ("users_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lead_routing" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lead_routing_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "lead_routing" CASCADE;
  DROP TABLE "lead_routing_rels" CASCADE;
  ALTER TABLE "proposals" ALTER COLUMN "company_phone" SET DEFAULT '+91 87960 92007';`)
}

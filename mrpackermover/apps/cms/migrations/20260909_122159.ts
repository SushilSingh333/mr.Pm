import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum__leads_v_version_source" AS ENUM('quote-form', 'price-check');
  CREATE TYPE "public"."enum__leads_v_version_status" AS ENUM('new', 'assigned', 'reassigned', 'contacted', 'call-not-picked', 'quoted', 'won', 'lost');
  CREATE TYPE "public"."enum_login_events_event" AS ENUM('login', 'logout');
  ALTER TYPE "public"."enum_leads_status" ADD VALUE 'assigned' BEFORE 'contacted';
  ALTER TYPE "public"."enum_leads_status" ADD VALUE 'reassigned' BEFORE 'contacted';
  ALTER TYPE "public"."enum_leads_status" ADD VALUE 'call-not-picked' BEFORE 'quoted';
  ALTER TYPE "public"."enum_users_role" ADD VALUE 'handler';
  ALTER TYPE "public"."enum_users_role" ADD VALUE 'sales';
  CREATE TABLE "leads_note_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"body" varchar NOT NULL,
  	"author_id" integer,
  	"at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_leads_v_version_note_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"body" varchar NOT NULL,
  	"author_id" integer,
  	"at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_leads_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar NOT NULL,
  	"version_phone" varchar NOT NULL,
  	"version_email" varchar,
  	"version_service" varchar,
  	"version_move_size" varchar,
  	"version_pickup" varchar,
  	"version_drop_location" varchar,
  	"version_move_date" timestamp(3) with time zone,
  	"version_customer_note" varchar,
  	"version_notes" varchar,
  	"version_source" "enum__leads_v_version_source" DEFAULT 'quote-form',
  	"version_status" "enum__leads_v_version_status" DEFAULT 'new' NOT NULL,
  	"version_assigned_to_id" integer,
  	"version_assigned_at" timestamp(3) with time zone,
  	"version_assigned_by_id" integer,
  	"version_acknowledged_at" timestamp(3) with time zone,
  	"version_source_ip" varchar,
  	"version_source_page" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "login_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"summary" varchar,
  	"event" "enum_login_events_event" NOT NULL,
  	"user_id" integer,
  	"user_email" varchar,
  	"user_role" varchar,
  	"ip" varchar,
  	"user_agent" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "leads" ADD COLUMN "email" varchar;
  ALTER TABLE "leads" ADD COLUMN "customer_note" varchar;
  ALTER TABLE "leads" ADD COLUMN "assigned_at" timestamp(3) with time zone;
  ALTER TABLE "leads" ADD COLUMN "assigned_by_id" integer;
  ALTER TABLE "leads" ADD COLUMN "acknowledged_at" timestamp(3) with time zone;
  ALTER TABLE "proposals" ADD COLUMN "created_by_id" integer;
  ALTER TABLE "users" ADD COLUMN "can_create_sales_users" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "login_events_id" integer;
  ALTER TABLE "leads_note_log" ADD CONSTRAINT "leads_note_log_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads_note_log" ADD CONSTRAINT "leads_note_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_leads_v_version_note_log" ADD CONSTRAINT "_leads_v_version_note_log_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_leads_v_version_note_log" ADD CONSTRAINT "_leads_v_version_note_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_leads_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_leads_v" ADD CONSTRAINT "_leads_v_parent_id_leads_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_leads_v" ADD CONSTRAINT "_leads_v_version_assigned_to_id_users_id_fk" FOREIGN KEY ("version_assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_leads_v" ADD CONSTRAINT "_leads_v_version_assigned_by_id_users_id_fk" FOREIGN KEY ("version_assigned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "login_events" ADD CONSTRAINT "login_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "leads_note_log_order_idx" ON "leads_note_log" USING btree ("_order");
  CREATE INDEX "leads_note_log_parent_id_idx" ON "leads_note_log" USING btree ("_parent_id");
  CREATE INDEX "leads_note_log_author_idx" ON "leads_note_log" USING btree ("author_id");
  CREATE INDEX "_leads_v_version_note_log_order_idx" ON "_leads_v_version_note_log" USING btree ("_order");
  CREATE INDEX "_leads_v_version_note_log_parent_id_idx" ON "_leads_v_version_note_log" USING btree ("_parent_id");
  CREATE INDEX "_leads_v_version_note_log_author_idx" ON "_leads_v_version_note_log" USING btree ("author_id");
  CREATE INDEX "_leads_v_parent_idx" ON "_leads_v" USING btree ("parent_id");
  CREATE INDEX "_leads_v_version_version_assigned_to_idx" ON "_leads_v" USING btree ("version_assigned_to_id");
  CREATE INDEX "_leads_v_version_version_assigned_by_idx" ON "_leads_v" USING btree ("version_assigned_by_id");
  CREATE INDEX "_leads_v_version_version_updated_at_idx" ON "_leads_v" USING btree ("version_updated_at");
  CREATE INDEX "_leads_v_version_version_created_at_idx" ON "_leads_v" USING btree ("version_created_at");
  CREATE INDEX "_leads_v_created_at_idx" ON "_leads_v" USING btree ("created_at");
  CREATE INDEX "_leads_v_updated_at_idx" ON "_leads_v" USING btree ("updated_at");
  CREATE INDEX "login_events_user_idx" ON "login_events" USING btree ("user_id");
  CREATE INDEX "login_events_updated_at_idx" ON "login_events" USING btree ("updated_at");
  CREATE INDEX "login_events_created_at_idx" ON "login_events" USING btree ("created_at");
  ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "proposals" ADD CONSTRAINT "proposals_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_login_events_fk" FOREIGN KEY ("login_events_id") REFERENCES "public"."login_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "leads_assigned_by_idx" ON "leads" USING btree ("assigned_by_id");
  CREATE INDEX "proposals_created_by_idx" ON "proposals" USING btree ("created_by_id");
  CREATE INDEX "payload_locked_documents_rels_login_events_id_idx" ON "payload_locked_documents_rels" USING btree ("login_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "leads_note_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_leads_v_version_note_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_leads_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "login_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "leads_note_log" CASCADE;
  DROP TABLE "_leads_v_version_note_log" CASCADE;
  DROP TABLE "_leads_v" CASCADE;
  DROP TABLE "login_events" CASCADE;
  ALTER TABLE "leads" DROP CONSTRAINT "leads_assigned_by_id_users_id_fk";
  
  ALTER TABLE "proposals" DROP CONSTRAINT "proposals_created_by_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_login_events_fk";
  
  ALTER TABLE "leads" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'new'::text;
  DROP TYPE "public"."enum_leads_status";
  CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'contacted', 'quoted', 'won', 'lost');
  ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'new'::"public"."enum_leads_status";
  ALTER TABLE "leads" ALTER COLUMN "status" SET DATA TYPE "public"."enum_leads_status" USING "status"::"public"."enum_leads_status";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'ops');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  DROP INDEX "leads_assigned_by_idx";
  DROP INDEX "proposals_created_by_idx";
  DROP INDEX "payload_locked_documents_rels_login_events_id_idx";
  ALTER TABLE "leads" DROP COLUMN "email";
  ALTER TABLE "leads" DROP COLUMN "customer_note";
  ALTER TABLE "leads" DROP COLUMN "assigned_at";
  ALTER TABLE "leads" DROP COLUMN "assigned_by_id";
  ALTER TABLE "leads" DROP COLUMN "acknowledged_at";
  ALTER TABLE "proposals" DROP COLUMN "created_by_id";
  ALTER TABLE "users" DROP COLUMN "can_create_sales_users";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "login_events_id";
  DROP TYPE "public"."enum__leads_v_version_source";
  DROP TYPE "public"."enum__leads_v_version_status";
  DROP TYPE "public"."enum_login_events_event";`)
}

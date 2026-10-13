import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_leads_source" ADD VALUE 'facebook-ad';
  ALTER TYPE "public"."enum_leads_source" ADD VALUE 'webhook';
  ALTER TYPE "public"."enum__leads_v_version_source" ADD VALUE 'facebook-ad';
  ALTER TYPE "public"."enum__leads_v_version_source" ADD VALUE 'webhook';
  CREATE TABLE "integrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lead_webhook_enabled" boolean DEFAULT true,
  	"lead_webhook_secret" varchar,
  	"lead_webhook_last_at" timestamp(3) with time zone,
  	"lead_webhook_count" numeric DEFAULT 0,
  	"lead_webhook_last_error" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "leads" ADD COLUMN "source_detail" varchar;
  ALTER TABLE "leads" ADD COLUMN "external_id" varchar;
  ALTER TABLE "leads" ADD COLUMN "raw_payload" jsonb;
  ALTER TABLE "_leads_v" ADD COLUMN "version_source_detail" varchar;
  ALTER TABLE "_leads_v" ADD COLUMN "version_external_id" varchar;
  ALTER TABLE "_leads_v" ADD COLUMN "version_raw_payload" jsonb;
  CREATE UNIQUE INDEX "leads_external_id_idx" ON "leads" USING btree ("external_id");
  CREATE INDEX "_leads_v_version_version_external_id_idx" ON "_leads_v" USING btree ("version_external_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "integrations" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "integrations" CASCADE;
  ALTER TABLE "leads" ALTER COLUMN "source" SET DATA TYPE text;
  ALTER TABLE "leads" ALTER COLUMN "source" SET DEFAULT 'quote-form'::text;
  DROP TYPE "public"."enum_leads_source";
  CREATE TYPE "public"."enum_leads_source" AS ENUM('quote-form', 'price-check');
  ALTER TABLE "leads" ALTER COLUMN "source" SET DEFAULT 'quote-form'::"public"."enum_leads_source";
  ALTER TABLE "leads" ALTER COLUMN "source" SET DATA TYPE "public"."enum_leads_source" USING "source"::"public"."enum_leads_source";
  ALTER TABLE "_leads_v" ALTER COLUMN "version_source" SET DATA TYPE text;
  ALTER TABLE "_leads_v" ALTER COLUMN "version_source" SET DEFAULT 'quote-form'::text;
  DROP TYPE "public"."enum__leads_v_version_source";
  CREATE TYPE "public"."enum__leads_v_version_source" AS ENUM('quote-form', 'price-check');
  ALTER TABLE "_leads_v" ALTER COLUMN "version_source" SET DEFAULT 'quote-form'::"public"."enum__leads_v_version_source";
  ALTER TABLE "_leads_v" ALTER COLUMN "version_source" SET DATA TYPE "public"."enum__leads_v_version_source" USING "version_source"::"public"."enum__leads_v_version_source";
  DROP INDEX "leads_external_id_idx";
  DROP INDEX "_leads_v_version_version_external_id_idx";
  ALTER TABLE "leads" DROP COLUMN "source_detail";
  ALTER TABLE "leads" DROP COLUMN "external_id";
  ALTER TABLE "leads" DROP COLUMN "raw_payload";
  ALTER TABLE "_leads_v" DROP COLUMN "version_source_detail";
  ALTER TABLE "_leads_v" DROP COLUMN "version_external_id";
  ALTER TABLE "_leads_v" DROP COLUMN "version_raw_payload";`)
}

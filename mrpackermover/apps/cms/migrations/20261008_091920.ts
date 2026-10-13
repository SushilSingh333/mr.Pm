import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_leads_status" ADD VALUE 'duplicate';
  ALTER TYPE "public"."enum__leads_v_version_status" ADD VALUE 'duplicate';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "leads" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'new'::text;
  DROP TYPE "public"."enum_leads_status";
  CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'assigned', 'reassigned', 'contacted', 'call-not-picked', 'call-later', 'follow-up', 'quoted', 'scheduled', 'won', 'lost', 'invalid');
  ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'new'::"public"."enum_leads_status";
  ALTER TABLE "leads" ALTER COLUMN "status" SET DATA TYPE "public"."enum_leads_status" USING "status"::"public"."enum_leads_status";
  ALTER TABLE "_leads_v" ALTER COLUMN "version_status" SET DATA TYPE text;
  ALTER TABLE "_leads_v" ALTER COLUMN "version_status" SET DEFAULT 'new'::text;
  DROP TYPE "public"."enum__leads_v_version_status";
  CREATE TYPE "public"."enum__leads_v_version_status" AS ENUM('new', 'assigned', 'reassigned', 'contacted', 'call-not-picked', 'call-later', 'follow-up', 'quoted', 'scheduled', 'won', 'lost', 'invalid');
  ALTER TABLE "_leads_v" ALTER COLUMN "version_status" SET DEFAULT 'new'::"public"."enum__leads_v_version_status";
  ALTER TABLE "_leads_v" ALTER COLUMN "version_status" SET DATA TYPE "public"."enum__leads_v_version_status" USING "version_status"::"public"."enum__leads_v_version_status";`)
}

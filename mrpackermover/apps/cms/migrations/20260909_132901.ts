import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "leads_note_log" ADD COLUMN "author_name" varchar;
  ALTER TABLE "leads" ADD COLUMN "assigned_by_name" varchar;
  ALTER TABLE "_leads_v_version_note_log" ADD COLUMN "author_name" varchar;
  ALTER TABLE "_leads_v" ADD COLUMN "version_assigned_by_name" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "leads_note_log" DROP COLUMN "author_name";
  ALTER TABLE "leads" DROP COLUMN "assigned_by_name";
  ALTER TABLE "_leads_v_version_note_log" DROP COLUMN "author_name";
  ALTER TABLE "_leads_v" DROP COLUMN "version_assigned_by_name";`)
}

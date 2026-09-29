-- Proves the migration pipeline can actually apply SQL, not just read history.
--
-- Until this ran, CI had only ever reported "Remote database is up to date" —
-- which is the answer you get when there is nothing to do, and says nothing
-- about whether applying a migration works. The write path goes through the
-- session-mode pooler and needs DDL, a transaction, and an insert into
-- supabase_migrations.schema_migrations; none of that had been exercised.
--
-- So this does the smallest thing that touches all three, and leaves nothing
-- behind: a table is created and dropped in the same transaction. The schema is
-- identical before and after. The only lasting effect is the row recording 0007
-- as applied, which is the point.
--
-- Safe to keep in history. Do not delete it to "clean up" — removing an applied
-- migration from the repo makes the next `db push` see a history entry with no
-- corresponding file.

create table if not exists public._migration_pipeline_smoke_test (
    checked_at timestamptz not null default now()
);

insert into public._migration_pipeline_smoke_test default values;

drop table if exists public._migration_pipeline_smoke_test;

-- Run once in the Supabase SQL editor (Project: bvaefzcsgtgqwftczixb).
-- Adds Tarun to the developers table so he appears in the assignee dropdown
-- across dev-boards, dev-backlog, dev-sprints, dev-reports, and any other
-- page that reads window.BNI_DEVS (loaded from supabase-config.js).

insert into developers (name, role)
select 'Tarun', 'Developer'
where not exists (select 1 from developers where name = 'Tarun');

-- Verify:
--   select id, name, role, created_at from developers where name = 'Tarun';

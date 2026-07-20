-- Dashboard To-Do list used by dashboard.html.
create table if not exists public.bni_todos (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  due_date   date not null,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists bni_todos_due_date_idx
  on public.bni_todos (due_date, created_at);

alter table public.bni_todos enable row level security;
drop policy if exists "bni_todos_anon_all" on public.bni_todos;
create policy "bni_todos_anon_all" on public.bni_todos
  for all to anon using (true) with check (true);

notify pgrst, 'reload schema';

-- Deployment prerequisite: review against the live schema in a staging project.
-- Administrative membership is independent of editable profile/user metadata.
begin;
create table public.operations_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null
);
alter table public.operations_members enable row level security;
revoke all on public.operations_members from public, anon, authenticated;
-- No client policies: only trusted database operators can assign membership.

create function public.operations_overview()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.operations_members where user_id = auth.uid()
  ) then
    raise exception 'Operations access required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'families', (select count(*) from public.profiles where role = 'parent'),
    'specialists', (select count(*) from public.specialists),
    'children', (select count(*) from public.children),
    'sessions', (select count(*) from public.sessions),
    'scheduled', (select count(*) from public.sessions where status = 'scheduled'),
    'completed', (select count(*) from public.sessions where status = 'completed'),
    'cancelled', (select count(*) from public.sessions where status = 'cancelled')
  );
end;
$$;
revoke all on function public.operations_overview() from public, anon;
grant execute on function public.operations_overview() to authenticated;
commit;

begin;
create function public.complete_social_profile(p_name text, p_role text, p_specialty text)
returns void language plpgsql security definer set search_path = pg_catalog as $$
declare
  account_id uuid := auth.uid();
  saved_role public.profiles.role%type;
  chosen_role public.profiles.role%type;
begin
  if account_id is null or not exists (
    select 1 from auth.identities where user_id = account_id and provider in ('google','facebook')
  ) then raise insufficient_privilege; end if;
  if p_name is null or length(trim(p_name)) not between 1 and 120 or p_role is null
     or p_role not in ('parent','specialist') then raise invalid_parameter_value; end if;
  if p_role = 'specialist' and (p_specialty is null or p_specialty not in
    ('aba','speech','occupational','behavioral','pecs','psychologist','neurologist'))
    then raise invalid_parameter_value; end if;
  chosen_role := p_role;
  insert into public.profiles(id, "Full_name", role) values(account_id,trim(p_name),chosen_role)
    on conflict(id) do update set "Full_name" = excluded."Full_name", role = excluded.role
    where public.profiles.role is null returning role into saved_role;
  if saved_role is null then return; end if;
  if saved_role = 'specialist' then
    insert into public.specialists(id, specialization) values(account_id,p_specialty) on conflict(id) do nothing;
  end if;
end $$;
revoke all on function public.complete_social_profile(text,text,text) from public, anon;
grant execute on function public.complete_social_profile(text,text,text) to authenticated;
commit;

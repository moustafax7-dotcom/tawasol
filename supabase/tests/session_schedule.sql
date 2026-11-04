-- Run against a disposable database AFTER the scheduling migration.
-- Fixture values use future dates and two synthetic specialists and children.
begin;
do $$
declare a uuid := '00000000-0000-0000-0000-000000000001';
declare b uuid := '00000000-0000-0000-0000-000000000002';
declare c uuid := '00000000-0000-0000-0000-000000000003';
declare d uuid := '00000000-0000-0000-0000-000000000004';
declare first_id uuid := gen_random_uuid();
declare day date := current_date + 30;
begin
  insert into public.sessions(id, specialist_id, child_id, session_date, session_time, duration_minutes, status)
    values (first_id,a,c,day,'11:00',60,'scheduled'), (gen_random_uuid(),a,d,day,'12:00',30,'scheduled');
  begin
    insert into public.sessions values(gen_random_uuid(),a,d,day,'11:45',30,'scheduled');
    raise exception 'overlapping specialist booking accepted';
  exception when exclusion_violation then null; end;
  begin
    insert into public.sessions values(gen_random_uuid(),b,c,day,'11:45',30,'scheduled');
    raise exception 'overlapping child booking accepted';
  exception when exclusion_violation then null; end;
  perform set_config('request.jwt.claim.sub',b::text,true);
  if public.reschedule_session(first_id,day,'11:00',day,'13:00') is not null then raise exception 'foreign move'; end if;
  perform set_config('request.jwt.claim.sub',a::text,true);
  begin
    perform public.reschedule_session(first_id,day,'11:00',day,'12:15');
    raise exception 'overlapping move accepted';
  exception when exclusion_violation then null; end;
  if public.reschedule_session(first_id,day,'11:00',day,'13:00') is distinct from first_id then raise exception 'move failed'; end if;
  if public.reschedule_session(first_id,day,'11:00',day,'15:00') is not null then raise exception 'stale move'; end if;
  update public.sessions set status='cancelled' where id=first_id;
  insert into public.sessions values(gen_random_uuid(),a,c,day,'13:00',30,'scheduled');
end $$;
rollback;

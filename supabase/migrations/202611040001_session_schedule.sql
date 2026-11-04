-- Review legacy active sessions before applying. Invalid times or existing
-- overlaps abort this transaction rather than changing appointment history.
begin;
create extension if not exists btree_gist;

-- The existing application writes ISO dates and HH:MM. The date parameter
-- requires a date column; text times and time without time zone are supported.
create function public.session_slot(d date, t text, minutes integer)
returns tsrange language plpgsql immutable set search_path = pg_catalog as $$
declare start_at timestamp;
begin
  if d is null or t is null or t !~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9](\.[0-9]{1,6})?)?$'
     or minutes is null or minutes not between 5 and 240 then
    raise exception 'Invalid active session slot' using errcode = '22023';
  end if;
  start_at := d + make_time(substr(t,1,2)::int, substr(t,4,2)::int, coalesce(nullif(substr(t,7),''),'0')::double precision);
  return tsrange(start_at, start_at + make_interval(mins => minutes), '[)');
end $$;

alter table public.sessions
  add constraint sessions_specialist_slots exclude using gist
    (specialist_id with =, public.session_slot(session_date, session_time::text, duration_minutes) with &&)
    where (status in ('scheduled','in_progress')),
  add constraint sessions_child_slots exclude using gist
    (child_id with =, public.session_slot(session_date, session_time::text, duration_minutes) with &&)
    where (status in ('scheduled','in_progress'));

-- Validate new bookings and moves in clinic time. No historical row is rewritten.
create function public.check_new_session_time() returns trigger
language plpgsql set search_path = pg_catalog as $$
declare wall_time timestamp;
declare instant timestamptz;
begin
  if new.status <> 'scheduled' then return new; end if;
  if tg_op = 'UPDATE' then
    if old.status = 'scheduled' and new.session_date is not distinct from old.session_date
       and new.session_time is not distinct from old.session_time then return new; end if;
  end if;
  wall_time := lower(public.session_slot(new.session_date, new.session_time::text, new.duration_minutes));
  instant := wall_time at time zone 'Africa/Cairo';
  if instant <= now() or (instant at time zone 'Africa/Cairo') <> wall_time
     or ((instant - interval '1 hour') at time zone 'Africa/Cairo') = wall_time
     or ((instant + interval '1 hour') at time zone 'Africa/Cairo') = wall_time then
    raise exception 'Choose an unambiguous future Cairo time' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger sessions_check_new_time before insert or update of status, session_date, session_time
on public.sessions for each row execute function public.check_new_session_time();

create function public.reschedule_session(p_id uuid, p_previous_date date, p_previous_time text,
                                          p_date date, p_time time)
returns uuid language plpgsql security invoker set search_path = pg_catalog as $$
declare saved uuid;
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  if p_date is null or p_time is null or p_date + p_time <= (now() at time zone 'Africa/Cairo') then
    raise exception 'Choose a future appointment' using errcode = '22023';
  end if;
  update public.sessions set session_date = p_date, session_time = p_time
    where id = p_id and specialist_id = auth.uid() and status = 'scheduled'
      and session_date = p_previous_date and session_time::text = p_previous_time
    returning id into saved;
  return saved;
end $$;
revoke all on function public.reschedule_session(uuid,date,text,date,time) from public, anon;
grant execute on function public.reschedule_session(uuid,date,text,date,time) to authenticated;
commit;

-- Supabase SQL editor mein ye poora run karo
create table poll_counts (
  choice text primary key check (choice in ('resign','stay')),
  total bigint not null default 0
);
insert into poll_counts values ('resign',0),('stay',0);

alter table poll_counts enable row level security;
create policy "anyone can read" on poll_counts for select using (true);

-- Vote sirf is function se jayega (direct update band)
create or replace function cast_vote(p_choice text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update poll_counts set total = total + 1 where choice = p_choice;
end $$;
revoke all on function cast_vote(text) from public;
grant execute on function cast_vote(text) to anon;

-- Realtime ON
alter publication supabase_realtime add table poll_counts;

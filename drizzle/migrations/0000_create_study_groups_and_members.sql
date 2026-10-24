create table public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  description text not null,
  preferred_time text not null,
  max_members integer not null check (max_members between 1 and 500),
  created_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  member_name text not null,
  created_at timestamptz not null default now()
);

create unique index group_members_unique_name
  on public.group_members (group_id, lower(member_name));

GRANT SELECT, INSERT ON public.study_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_groups TO authenticated;
GRANT ALL ON public.study_groups TO service_role;
GRANT SELECT ON public.group_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;

ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view study groups"
  ON public.study_groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create a study group"
  ON public.study_groups FOR INSERT TO anon, authenticated WITH CHECK (
    char_length(btrim(name)) between 3 and 120
    AND char_length(btrim(subject)) between 2 and 60
    AND char_length(btrim(description)) <= 500
    AND max_members between 1 and 500
  );
CREATE POLICY "Anyone can view group members"
  ON public.group_members FOR SELECT TO anon, authenticated USING (true);

-- Capacity + duplicate enforcement lives in the database so it cannot be bypassed
create or replace function public.enforce_group_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max integer;
  v_count integer;
begin
  select max_members into v_max from public.study_groups where id = new.group_id;
  if v_max is null then
    raise exception 'This group no longer exists';
  end if;
  select count(*) into v_count from public.group_members where group_id = new.group_id;
  if v_count >= v_max then
    raise exception 'This group has reached its maximum number of members';
  end if;
  return new;
end;
$$;

create trigger enforce_group_capacity_insert
  before insert on public.group_members
  for each row execute function public.enforce_group_capacity();

create or replace function public.join_study_group(p_group_id uuid, p_member_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(p_member_name);
  v_count integer;
begin
  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 80 then
    return jsonb_build_object('status', 'error', 'message', 'Please enter a name between 2 and 80 characters.');
  end if;

  select count(*) into v_count from public.group_members where group_id = p_group_id;

  begin
    insert into public.group_members (group_id, member_name) values (p_group_id, v_name);
  exception
    when unique_violation then
      return jsonb_build_object('status', 'duplicate', 'message', 'Someone with this name has already joined this group.', 'member_count', v_count);
    when others then
      return jsonb_build_object('status', 'error', 'message', 'Could not join this group right now. Please try again.');
  end;

  return jsonb_build_object('status', 'joined', 'message', 'You joined the group!', 'member_count', v_count + 1);
end;
$$;

GRANT EXECUTE ON FUNCTION public.join_study_group(uuid, text) TO anon, authenticated;

-- Realistic seed data for the initial preview (delete or edit freely)
INSERT INTO public.study_groups (name, subject, description, preferred_time, max_members) VALUES
  ('Calculus Crew', 'Mathematics', 'Working through integrals, series and problem sets twice a week. Bring your toughest homework questions.', 'Weekday evenings, 6–8 PM', 8),
  ('Orgo Survivors', 'Chemistry', 'Reaction mechanisms flashcards and weekly practice exams before midterms. All levels welcome.', 'Saturday mornings, 10 AM–12 PM', 10),
  ('DSA Grind House', 'Computer Science', 'LeetCode-style sessions on arrays, trees and graphs, followed by mock interview practice.', 'Weekday evenings, 7–9 PM', 6),
  ('Linear Algebra Legends', 'Mathematics', 'Eigenvalues, vector spaces and proof-writing practice. We rotate who presents each session.', 'Sunday afternoons, 2–4 PM', 8),
  ('Econ Exam Squad', 'Economics', 'Micro and macro past-paper marathons with shared summary sheets before finals.', 'Friday afternoons, 3–5 PM', 12),
  ('Spanish Café Chat', 'Languages', 'Casual conversation practice over coffee. Half an hour of Spanish only, half an hour of Q&A on grammar.', 'Tuesday lunch, 12–1 PM', 6);

INSERT INTO public.group_members (group_id, member_name)
SELECT g.id, m.name
FROM public.study_groups g
JOIN (VALUES
  ('Calculus Crew', 'Aarav'),
  ('Calculus Crew', 'Priya'),
  ('Calculus Crew', 'Jordan'),
  ('Orgo Survivors', 'Meera'),
  ('Orgo Survivors', 'Sam'),
  ('DSA Grind House', 'Chen'),
  ('DSA Grind House', 'Isabel'),
  ('DSA Grind House', 'Noah'),
  ('DSA Grind House', 'Fatima'),
  ('Linear Algebra Legends', 'Rohan'),
  ('Linear Algebra Legends', 'Grace'),
  ('Econ Exam Squad', 'Diego'),
  ('Econ Exam Squad', 'Aisha')
) AS m(group_name, name) ON m.group_name = g.name;

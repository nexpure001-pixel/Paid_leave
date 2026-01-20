-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS Table (Syncs with Auth or Standalone)
-- Note: In a real Supabase app, we often use `auth.users`, but for this system we'll create a public profiles table.
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text check (role in ('admin', 'employee')) default 'employee',
  joined_at date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;

-- 2. LEAVE GRANTS (有給付与データ)
create table public.leave_grants (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  days_granted numeric(5, 1) not null check (days_granted > 0),
  days_used numeric(5, 1) not null default 0 check (days_used >= 0),
  valid_from date not null,
  expiry_date date not null,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Constraint: Used days cannot exceed granted days
  constraint check_days_limit check (days_used <= days_granted)
);

-- Index for faster expiry extraction
create index idx_leave_grants_user_expiry on public.leave_grants(user_id, expiry_date);

-- Enable RLS
alter table public.leave_grants enable row level security;

-- 3. LEAVE REQUESTS (有給申請)
create table public.leave_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  date_requested date not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.leave_requests enable row level security;

-- 4. LEAVE CONSUMPTIONS (消化履歴 - Linking table)
create table public.leave_consumptions (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references public.leave_requests(id) on delete cascade not null,
  grant_id uuid references public.leave_grants(id) on delete cascade not null,
  days_consumed numeric(5, 1) not null check (days_consumed > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.leave_consumptions enable row level security;


-- --- FUNCTIONS ---

-- Function 1: Calculate Remaining Leave
-- Returns the total remaining days for a user, considering only valid grants.
create or replace function calculate_remaining_leave(target_user_id uuid)
returns numeric as $$
declare
  total_remaining numeric;
begin
  select coalesce(sum(days_granted - days_used), 0)
  into total_remaining
  from public.leave_grants
  where user_id = target_user_id
    and expiry_date >= current_date;
  
  return total_remaining;
end;
$$ language plpgsql security definer;

-- Function 2: Approve Leave Request with FIFO Logic
-- This function handles the complex logic of deducting days from the oldest valid grants.
create or replace function approve_leave_request(target_request_id uuid)
returns void as $$
declare
  req_record record;
  grant_record record;
  days_needed numeric;
  days_available numeric;
  days_to_take numeric;
begin
  -- 1. Fetch the request
  select * into req_record from public.leave_requests where id = target_request_id for update;
  
  if req_record.status != 'pending' then
    raise exception 'Request is not pending';
  end if;

  -- Since this is a daily system, we assume 1 request = 1 day (or define unit elsewhere).
  -- For now, let's assume 1 day per request row for simplicity, or we can add `days_requested` column to `leave_requests`.
  -- Let's update `leave_requests` to allow variable days if needed, but per requirements "date_requested" implies specific dates.
  -- Assumption: 1 record = 1 day off.
  days_needed := 1.0; 

  -- Check global Remaining
  if calculate_remaining_leave(req_record.user_id) < days_needed then
     raise exception 'Insufficient leave balance';
  end if;

  -- 2. Iterate through valid grants in FIFO order (Oldest Expiry First)
  for grant_record in 
    select * from public.leave_grants 
    where user_id = req_record.user_id 
      and expiry_date >= current_date
      and (days_granted - days_used) > 0
    order by expiry_date asc
    for update
  loop
    exit when days_needed <= 0;

    days_available := grant_record.days_granted - grant_record.days_used;
    
    if days_available >= days_needed then
      days_to_take := days_needed;
    else
      days_to_take := days_available;
    end if;

    -- Update Grant
    update public.leave_grants 
    set days_used = days_used + days_to_take
    where id = grant_record.id;

    -- Create Consumption Record
    insert into public.leave_consumptions (request_id, grant_id, days_consumed)
    values (target_request_id, grant_record.id, days_to_take);

    days_needed := days_needed - days_to_take;
  end loop;

  -- 3. Finalize Request
  update public.leave_requests
  set status = 'approved'
  where id = target_request_id;

end;
$$ language plpgsql security definer;


-- --- POLICIES (Simple Setup for Start) ---

-- Users can read their own profile
create policy "Users can see own profile" on public.users for select using (auth.uid() = id);

-- Admins can see all profiles (Assuming we check role in app or via another policy mechanism)
-- For simplicity, let's allow read for now. In production, we need a secure `is_admin()` function.
create policy "Public read for demo" on public.users for select using (true);

-- Allow new user signup to insert into users table via Trigger or manual insert
create policy "Users can insert their own profile" on public.users for insert with check (auth.uid() = id);

-- Same for grants and requests
create policy "Users read own grants" on public.leave_grants for select using (auth.uid() = user_id);
-- create policy "Admins read all grants" ... 

create policy "Users read own requests" on public.leave_requests for select using (auth.uid() = user_id);
create policy "Users create requests" on public.leave_requests for insert with check (auth.uid() = user_id);

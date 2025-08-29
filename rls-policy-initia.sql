-- =====================================================
-- STRENTOR RLS POLICIES - SIMPLIFIED APPROACH
-- =====================================================
-- Core Philosophy: RLS handles "WHO can access WHOSE data"
-- Server Actions handle "WHAT business rules apply"
-- =====================================================

-- =====================================================
-- 1. USERS_PROFILE TABLE
-- =====================================================

-- Enable RLS
alter table public.users_profile enable row level security;

-- Policy 1: Users can view and update their own profile
create policy "Users can view own profile"
on public.users_profile
for select
to authenticated
using ( (select auth.uid()) = id );

create policy "Users can update own profile"
on public.users_profile
for update
to authenticated
using ( (select auth.uid()) = id )
with check ( (select auth.uid()) = id );

-- Policy 2: Trainers can view their assigned clients' profiles
create policy "Trainers can view assigned client profiles"
on public.users_profile
for select
to authenticated
using (
  exists (
    select 1 
    from public.trainer_clients 
    where trainer_clients.client_id = users_profile.id 
    and trainer_clients.trainer_id = (select auth.uid())
  )
);

-- Policy 3: Admins can view and update all profiles
create policy "Admins can view all profiles"
on public.users_profile
for select
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

create policy "Admins can update all profiles"
on public.users_profile
for update
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
)
with check ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Policy 4: Allow user profile creation (for new signups)
create policy "Allow user profile creation"
on public.users_profile
for insert
to authenticated
with check ( (select auth.uid()) = id );

-- Policy 5: Admins can create profiles (for admin user management)
create policy "Admins can create profiles"
on public.users_profile
for insert
to authenticated
with check ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No DELETE policy - users should be soft deleted/deactivated

-- =====================================================
-- 2. TRAINER_CLIENTS TABLE
-- =====================================================

-- Enable RLS
alter table public.trainer_clients enable row level security;

-- Policy 1: Clients can view their own trainer assignments
create policy "Clients can view own trainer assignments"
on public.trainer_clients
for select
to authenticated
using ( (select auth.uid()) = client_id );

-- Policy 2: Trainers can view their own client assignments
create policy "Trainers can view own client assignments"
on public.trainer_clients
for select
to authenticated
using ( (select auth.uid()) = trainer_id );

-- Policy 3: Only admins can manage trainer-client relationships
create policy "Admins can view all trainer-client relationships"
on public.trainer_clients
for select
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

create policy "Only admins can create trainer-client relationships"
on public.trainer_clients
for insert
to authenticated
with check ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

create policy "Only admins can update trainer-client relationships"
on public.trainer_clients
for update
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
)
with check ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

create policy "Only admins can delete trainer-client relationships"
on public.trainer_clients
for delete
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- =====================================================
-- 3. SUBSCRIPTION-RELATED TABLES
-- =====================================================

-- -----------------------------------------------------
-- 3.1 SUBSCRIPTION_PLANS TABLE
-- -----------------------------------------------------

-- Enable RLS
alter table public.subscription_plans enable row level security;

-- Policy 1: Public read access for marketing pages
create policy "Public can view subscription plans"
on public.subscription_plans
for select
to anon, authenticated
using ( true );

-- Policy 2: Only admins can manage subscription plans
create policy "Only admins can create subscription plans"
on public.subscription_plans
for insert
to authenticated
with check ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

create policy "Only admins can update subscription plans"
on public.subscription_plans
for update
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
)
with check ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No DELETE policy - subscription plans should use soft delete (is_archived field)

-- -----------------------------------------------------
-- 3.2 USER_SUBSCRIPTIONS TABLE
-- -----------------------------------------------------

-- Enable RLS
alter table public.user_subscriptions enable row level security;

-- Policy 1: Users can view their own subscriptions
create policy "Users can view own subscriptions"
on public.user_subscriptions
for select
to authenticated
using ( (select auth.uid()) = user_id );

-- Policy 2: Trainers can view their assigned clients' subscriptions
create policy "Trainers can view assigned client subscriptions"
on public.user_subscriptions
for select
to authenticated
using (
  exists (
    select 1 
    from public.trainer_clients 
    where trainer_clients.client_id = user_subscriptions.user_id 
    and trainer_clients.trainer_id = (select auth.uid())
  )
);

-- Policy 3: Admins can manage all subscriptions
create policy "Admins can view all subscriptions"
on public.user_subscriptions
for select
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

create policy "Only admins can update subscriptions"
on public.user_subscriptions
for update
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
)
with check ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No INSERT/DELETE policies - subscriptions created by webhooks only

-- -----------------------------------------------------
-- 3.3 SUBSCRIPTION_EVENTS TABLE (Admin Only)
-- -----------------------------------------------------

-- Enable RLS
alter table public.subscription_events enable row level security;

-- Policy 1: Only admins can access subscription events
create policy "Only admins can view subscription events"
on public.subscription_events
for select
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No INSERT/UPDATE/DELETE policies - subscription events are audit trails created by webhooks only

-- -----------------------------------------------------
-- 3.4 WEBHOOK_EVENTS TABLE (Admin Only)
-- -----------------------------------------------------

-- Enable RLS
alter table public.webhook_events enable row level security;

-- Policy 1: Only admins can access webhook events
create policy "Only admins can view webhook events"
on public.webhook_events
for select
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No INSERT/UPDATE/DELETE policies - webhook events are system logs, read-only

-- =====================================================
-- 4. WORKOUT-RELATED TABLES
-- =====================================================

-- -----------------------------------------------------
-- 4.1 WORKOUT_EXERCISE_LISTS TABLE (Exercise Library)
-- -----------------------------------------------------

-- Enable RLS
alter table public.workout_exercise_lists enable row level security;

-- Policy 1: Everyone can view all exercises (shared library)
create policy "Everyone can view exercise library"
on public.workout_exercise_lists
for select
to authenticated
using ( true );

-- Policy 2: Only admins can manage exercises
create policy "Only admins can create exercises"
on public.workout_exercise_lists
for insert
to authenticated
with check ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

create policy "Only admins can update exercises"
on public.workout_exercise_lists
for update
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
)
with check ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No DELETE policy - exercises should use soft delete when needed

-- -----------------------------------------------------
-- 4.2 WORKOUT_PLANS TABLE
-- -----------------------------------------------------

-- Enable RLS
alter table public.workout_plans enable row level security;

-- Policy 1: Clients can view their own workout plans
create policy "Clients can view own workout plans"
on public.workout_plans
for select
to authenticated
using ( (select auth.uid()) = client_id );

-- Policy 2: Trainers can manage their assigned clients' workout plans
create policy "Trainers can view assigned client workout plans"
on public.workout_plans
for select
to authenticated
using (
  exists (
    select 1 
    from public.trainer_clients 
    where trainer_clients.client_id = workout_plans.client_id 
    and trainer_clients.trainer_id = (select auth.uid())
  )
);

create policy "Trainers can create workout plans for assigned clients"
on public.workout_plans
for insert
to authenticated
with check (
  exists (
    select 1 
    from public.trainer_clients 
    where trainer_clients.client_id = workout_plans.client_id 
    and trainer_clients.trainer_id = (select auth.uid())
  )
);

create policy "Trainers can update assigned client workout plans"
on public.workout_plans
for update
to authenticated
using (
  exists (
    select 1 
    from public.trainer_clients 
    where trainer_clients.client_id = workout_plans.client_id 
    and trainer_clients.trainer_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 
    from public.trainer_clients 
    where trainer_clients.client_id = workout_plans.client_id 
    and trainer_clients.trainer_id = (select auth.uid())
  )
);

create policy "Trainers can delete assigned client workout plans"
on public.workout_plans
for delete
to authenticated
using (
  exists (
    select 1 
    from public.trainer_clients 
    where trainer_clients.client_id = workout_plans.client_id 
    and trainer_clients.trainer_id = (select auth.uid())
  )
);

-- Policy 3: Admins can manage all workout plans
create policy "Admins can view all workout plans"
on public.workout_plans
for select
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No INSERT/UPDATE/DELETE policies for admins - workout plans are historical data, read-only

-- -----------------------------------------------------
-- 4.3 WORKOUT_DAYS TABLE
-- -----------------------------------------------------

-- Enable RLS
alter table public.workout_days enable row level security;

-- Policy 1: Clients can view their own workout days
create policy "Clients can view own workout days"
on public.workout_days
for select
to authenticated
using (
  exists (
    select 1 
    from public.workout_plans 
    where workout_plans.id = workout_days.plan_id 
    and workout_plans.client_id = (select auth.uid())
  )
);

-- Policy 2: Trainers can manage workout days for assigned clients
create policy "Trainers can view assigned client workout days"
on public.workout_days
for select
to authenticated
using (
  exists (
    select 1 
    from public.workout_plans wp
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wp.id = workout_days.plan_id 
    and tc.trainer_id = (select auth.uid())
  )
);

create policy "Trainers can create workout days for assigned clients"
on public.workout_days
for insert
to authenticated
with check (
  exists (
    select 1 
    from public.workout_plans wp
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wp.id = workout_days.plan_id 
    and tc.trainer_id = (select auth.uid())
  )
);

create policy "Trainers can update workout days for assigned clients"
on public.workout_days
for update
to authenticated
using (
  exists (
    select 1 
    from public.workout_plans wp
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wp.id = workout_days.plan_id 
    and tc.trainer_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 
    from public.workout_plans wp
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wp.id = workout_days.plan_id 
    and tc.trainer_id = (select auth.uid())
  )
);

create policy "Trainers can delete workout days for assigned clients"
on public.workout_days
for delete
to authenticated
using (
  exists (
    select 1 
    from public.workout_plans wp
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wp.id = workout_days.plan_id 
    and tc.trainer_id = (select auth.uid())
  )
);

-- Policy 3: Admins can manage all workout days
create policy "Admins can view all workout days"
on public.workout_days
for select
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No INSERT/UPDATE/DELETE policies for admins - workout days are historical data, read-only

-- -----------------------------------------------------
-- 4.4 WORKOUT_DAY_EXERCISES TABLE
-- -----------------------------------------------------

-- Enable RLS
alter table public.workout_day_exercises enable row level security;

-- Policy 1: Clients can view their own workout exercises
create policy "Clients can view own workout exercises"
on public.workout_day_exercises
for select
to authenticated
using (
  exists (
    select 1 
    from public.workout_days wd
    join public.workout_plans wp on wd.plan_id = wp.id
    where wd.id = workout_day_exercises.workout_day_id 
    and wp.client_id = (select auth.uid())
  )
);

-- Policy 2: Trainers can manage workout exercises for assigned clients
create policy "Trainers can view assigned client workout exercises"
on public.workout_day_exercises
for select
to authenticated
using (
  exists (
    select 1 
    from public.workout_days wd
    join public.workout_plans wp on wd.plan_id = wp.id
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wd.id = workout_day_exercises.workout_day_id 
    and tc.trainer_id = (select auth.uid())
  )
);

create policy "Trainers can create workout exercises for assigned clients"
on public.workout_day_exercises
for insert
to authenticated
with check (
  exists (
    select 1 
    from public.workout_days wd
    join public.workout_plans wp on wd.plan_id = wp.id
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wd.id = workout_day_exercises.workout_day_id 
    and tc.trainer_id = (select auth.uid())
  )
);

create policy "Trainers can update workout exercises for assigned clients"
on public.workout_day_exercises
for update
to authenticated
using (
  exists (
    select 1 
    from public.workout_days wd
    join public.workout_plans wp on wd.plan_id = wp.id
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wd.id = workout_day_exercises.workout_day_id 
    and tc.trainer_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 
    from public.workout_days wd
    join public.workout_plans wp on wd.plan_id = wp.id
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wd.id = workout_day_exercises.workout_day_id 
    and tc.trainer_id = (select auth.uid())
  )
);

create policy "Trainers can delete workout exercises for assigned clients"
on public.workout_day_exercises
for delete
to authenticated
using (
  exists (
    select 1 
    from public.workout_days wd
    join public.workout_plans wp on wd.plan_id = wp.id
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wd.id = workout_day_exercises.workout_day_id 
    and tc.trainer_id = (select auth.uid())
  )
);

-- Policy 3: Admins can manage all workout exercises
create policy "Admins can view all workout exercises"
on public.workout_day_exercises
for select
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No INSERT/UPDATE/DELETE policies for admins - workout exercises are historical data, read-only

-- -----------------------------------------------------
-- 4.5 WORKOUT_SET_INSTRUCTIONS TABLE
-- -----------------------------------------------------

-- Enable RLS
alter table public.workout_set_instructions enable row level security;

-- Policy 1: Clients can view their own workout set instructions
create policy "Clients can view own workout set instructions"
on public.workout_set_instructions
for select
to authenticated
using (
  exists (
    select 1 
    from public.workout_day_exercises wde
    join public.workout_days wd on wde.workout_day_id = wd.id
    join public.workout_plans wp on wd.plan_id = wp.id
    where wde.id = workout_set_instructions.exercise_id 
    and wp.client_id = (select auth.uid())
  )
);

-- Policy 2: Trainers can manage set instructions for assigned clients
create policy "Trainers can view assigned client set instructions"
on public.workout_set_instructions
for select
to authenticated
using (
  exists (
    select 1 
    from public.workout_day_exercises wde
    join public.workout_days wd on wde.workout_day_id = wd.id
    join public.workout_plans wp on wd.plan_id = wp.id
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wde.id = workout_set_instructions.exercise_id 
    and tc.trainer_id = (select auth.uid())
  )
);

create policy "Trainers can create set instructions for assigned clients"
on public.workout_set_instructions
for insert
to authenticated
with check (
  exists (
    select 1 
    from public.workout_day_exercises wde
    join public.workout_days wd on wde.workout_day_id = wd.id
    join public.workout_plans wp on wd.plan_id = wp.id
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wde.id = workout_set_instructions.exercise_id 
    and tc.trainer_id = (select auth.uid())
  )
);

create policy "Trainers can update set instructions for assigned clients"
on public.workout_set_instructions
for update
to authenticated
using (
  exists (
    select 1 
    from public.workout_day_exercises wde
    join public.workout_days wd on wde.workout_day_id = wd.id
    join public.workout_plans wp on wd.plan_id = wp.id
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wde.id = workout_set_instructions.exercise_id 
    and tc.trainer_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 
    from public.workout_day_exercises wde
    join public.workout_days wd on wde.workout_day_id = wd.id
    join public.workout_plans wp on wd.plan_id = wp.id
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wde.id = workout_set_instructions.exercise_id 
    and tc.trainer_id = (select auth.uid())
  )
);

create policy "Trainers can delete set instructions for assigned clients"
on public.workout_set_instructions
for delete
to authenticated
using (
  exists (
    select 1 
    from public.workout_day_exercises wde
    join public.workout_days wd on wde.workout_day_id = wd.id
    join public.workout_plans wp on wd.plan_id = wp.id
    join public.trainer_clients tc on wp.client_id = tc.client_id
    where wde.id = workout_set_instructions.exercise_id 
    and tc.trainer_id = (select auth.uid())
  )
);

-- Policy 3: Admins can manage all set instructions
create policy "Admins can view all set instructions"
on public.workout_set_instructions
for select
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No INSERT/UPDATE/DELETE policies for admins - set instructions are historical data, read-only

-- -----------------------------------------------------
-- 4.6 EXERCISE_LOGS TABLE
-- -----------------------------------------------------

-- Enable RLS
alter table public.exercise_logs enable row level security;

-- Policy 1: Clients can manage their own exercise logs
create policy "Clients can view own exercise logs"
on public.exercise_logs
for select
to authenticated
using ( (select auth.uid()) = client_id );

create policy "Clients can create own exercise logs"
on public.exercise_logs
for insert
to authenticated
with check ( (select auth.uid()) = client_id );

create policy "Clients can update own exercise logs"
on public.exercise_logs
for update
to authenticated
using ( (select auth.uid()) = client_id )
with check ( (select auth.uid()) = client_id );

create policy "Clients can delete own exercise logs"
on public.exercise_logs
for delete
to authenticated
using ( (select auth.uid()) = client_id );

-- Policy 2: Trainers can view their assigned clients' exercise logs
create policy "Trainers can view assigned client exercise logs"
on public.exercise_logs
for select
to authenticated
using (
  exists (
    select 1 
    from public.trainer_clients 
    where trainer_clients.client_id = exercise_logs.client_id 
    and trainer_clients.trainer_id = (select auth.uid())
  )
);

-- Policy 3: Admins can manage all exercise logs
create policy "Admins can view all exercise logs"
on public.exercise_logs
for select
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No INSERT/UPDATE/DELETE policies for admins - exercise logs are historical data, read-only

-- =====================================================
-- 5. CLIENT PROGRESS TABLES
-- =====================================================

-- -----------------------------------------------------
-- 5.1 WEIGHT_LOGS TABLE
-- -----------------------------------------------------

-- Enable RLS
alter table public.weight_logs enable row level security;

-- Policy 1: Clients can manage their own weight logs
create policy "Clients can view own weight logs"
on public.weight_logs
for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Clients can create own weight logs"
on public.weight_logs
for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "Clients can update own weight logs"
on public.weight_logs
for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

create policy "Clients can delete own weight logs"
on public.weight_logs
for delete
to authenticated
using ( (select auth.uid()) = user_id );

-- Policy 2: Trainers can view their assigned clients' weight logs
create policy "Trainers can view assigned client weight logs"
on public.weight_logs
for select
to authenticated
using (
  exists (
    select 1 
    from public.trainer_clients 
    where trainer_clients.client_id = weight_logs.user_id 
    and trainer_clients.trainer_id = (select auth.uid())
  )
);

-- Policy 3: Admins can manage all weight logs
create policy "Admins can view all weight logs"
on public.weight_logs
for select
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No INSERT/UPDATE/DELETE policies for admins - weight logs are historical progress data, read-only

-- -----------------------------------------------------
-- 5.2 CALCULATOR_SESSIONS TABLE
-- -----------------------------------------------------

-- Enable RLS
alter table public.calculator_sessions enable row level security;

-- Policy 1: Clients can manage their own calculator sessions
create policy "Clients can view own calculator sessions"
on public.calculator_sessions
for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Clients can create own calculator sessions"
on public.calculator_sessions
for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "Clients can update own calculator sessions"
on public.calculator_sessions
for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

create policy "Clients can delete own calculator sessions"
on public.calculator_sessions
for delete
to authenticated
using ( (select auth.uid()) = user_id );

-- Policy 2: Trainers can view their assigned clients' calculator sessions
create policy "Trainers can view assigned client calculator sessions"
on public.calculator_sessions
for select
to authenticated
using (
  exists (
    select 1 
    from public.trainer_clients 
    where trainer_clients.client_id = calculator_sessions.user_id 
    and trainer_clients.trainer_id = (select auth.uid())
  )
);

-- Policy 3: Admins can manage all calculator sessions
create policy "Admins can view all calculator sessions"
on public.calculator_sessions
for select
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No INSERT/UPDATE/DELETE policies for admins - calculator sessions are historical usage data, read-only

-- -----------------------------------------------------
-- 5.3 CLIENT_MAX_LIFTS TABLE
-- -----------------------------------------------------

-- Enable RLS
alter table public.client_max_lifts enable row level security;

-- Policy 1: Clients can manage their own max lifts
create policy "Clients can view own max lifts"
on public.client_max_lifts
for select
to authenticated
using ( (select auth.uid()) = client_id );

create policy "Clients can create own max lifts"
on public.client_max_lifts
for insert
to authenticated
with check ( (select auth.uid()) = client_id );

create policy "Clients can update own max lifts"
on public.client_max_lifts
for update
to authenticated
using ( (select auth.uid()) = client_id )
with check ( (select auth.uid()) = client_id );

create policy "Clients can delete own max lifts"
on public.client_max_lifts
for delete
to authenticated
using ( (select auth.uid()) = client_id );

-- Policy 2: Trainers can view their assigned clients' max lifts
create policy "Trainers can view assigned client max lifts"
on public.client_max_lifts
for select
to authenticated
using (
  exists (
    select 1 
    from public.trainer_clients 
    where trainer_clients.client_id = client_max_lifts.client_id 
    and trainer_clients.trainer_id = (select auth.uid())
  )
);

-- Policy 3: Admins can manage all max lifts
create policy "Admins can view all max lifts"
on public.client_max_lifts
for select
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No INSERT/UPDATE/DELETE policies for admins - max lifts are historical achievement data, read-only

-- -----------------------------------------------------
-- 5.4 TRANSFORMATION_PHOTOS TABLE (with Privacy Settings)
-- -----------------------------------------------------

-- Enable RLS
alter table public.transformation_photos enable row level security;

-- Policy 1: Clients can manage their own transformation photos
create policy "Clients can view own transformation photos"
on public.transformation_photos
for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Clients can create own transformation photos"
on public.transformation_photos
for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "Clients can update own transformation photos"
on public.transformation_photos
for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

create policy "Clients can delete own transformation photos"
on public.transformation_photos
for delete
to authenticated
using ( (select auth.uid()) = user_id );

-- Policy 2: Anyone can view public transformation photos
create policy "Anyone can view public transformation photos"
on public.transformation_photos
for select
to authenticated
using ( privacy_setting = 'PUBLIC' );

-- Policy 3: Trainers can view their assigned clients' photos (regardless of privacy)
create policy "Trainers can view assigned client transformation photos"
on public.transformation_photos
for select
to authenticated
using (
  exists (
    select 1 
    from public.trainer_clients 
    where trainer_clients.client_id = transformation_photos.user_id 
    and trainer_clients.trainer_id = (select auth.uid())
  )
);

-- Policy 4: Admins can manage all transformation photos
create policy "Admins can view all transformation photos"
on public.transformation_photos
for select
to authenticated
using ( 
  (select auth.jwt() ->> 'user_role') in ('ADMIN', 'FITNESS_TRAINER_ADMIN') 
);

-- Note: No INSERT/UPDATE/DELETE policies for admins - transformation photos are user-generated content, read-only

-- =====================================================
-- COMPLETION SUMMARY
-- =====================================================
-- 
-- ✅ ALL RLS POLICIES CREATED FOR STRENTOR DATABASE
-- ✅ DATA INTEGRITY FOCUSED - NO HARD DELETES, MINIMAL ADMIN MUTATIONS
-- 
-- Tables Covered:
-- 1. users_profile - User identity and profiles
-- 2. trainer_clients - Trainer-client relationships  
-- 3. subscription_plans - Public subscription plans
-- 4. user_subscriptions - User subscription data
-- 5. subscription_events - Admin-only billing events (READ ONLY)
-- 6. webhook_events - Admin-only system events (READ ONLY)
-- 7. workout_exercise_lists - Shared exercise library
-- 8. workout_plans - Client workout plans (HISTORICAL - READ ONLY FOR ADMINS)
-- 9. workout_days - Individual workout days (HISTORICAL - READ ONLY FOR ADMINS)
-- 10. workout_day_exercises - Exercises within workout days (HISTORICAL - READ ONLY FOR ADMINS)
-- 11. workout_set_instructions - Set instructions for exercises (HISTORICAL - READ ONLY FOR ADMINS)
-- 12. exercise_logs - Client exercise performance logs (HISTORICAL - READ ONLY FOR ADMINS)
-- 13. weight_logs - Client weight tracking (HISTORICAL - READ ONLY FOR ADMINS)
-- 14. calculator_sessions - Client calculator usage (HISTORICAL - READ ONLY FOR ADMINS)
-- 15. client_max_lifts - Client maximum lift records (HISTORICAL - READ ONLY FOR ADMINS)
-- 16. transformation_photos - Client progress photos with privacy (READ ONLY FOR ADMINS)
--
-- Core Access Patterns:
-- ✅ Own Data: Users can access their own records
-- ✅ Trainer-Client: Trainers can access assigned clients' data
-- ✅ Admin Read Access: ADMIN and FITNESS_TRAINER_ADMIN can view all data
-- ✅ Limited Admin Mutations: Only essential admin operations allowed
-- ✅ Public Content: Public transformation photos and subscription plans
-- ✅ Privacy Controls: Transformation photos respect privacy settings
-- ✅ Data Preservation: Historical workout and progress data is protected
--
-- Admin Access Matrix:
-- - users_profile: SELECT, INSERT, UPDATE (no delete - use soft delete)
-- - trainer_clients: SELECT, INSERT, UPDATE, DELETE (relationship management)
-- - subscription_plans: SELECT, INSERT, UPDATE (no delete - use is_archived)
-- - user_subscriptions: SELECT, UPDATE (status corrections only)
-- - subscription_events: SELECT ONLY (audit trail)
-- - webhook_events: SELECT ONLY (system logs)
-- - workout_exercise_lists: SELECT, INSERT, UPDATE (exercise library)
-- - All Workout Tables: SELECT ONLY (historical data preservation)
-- - All Progress Tables: SELECT ONLY (historical data preservation)
--
-- Security Philosophy:
-- - RLS handles "WHO can access WHOSE data"
-- - Server Actions handle "WHAT business rules apply"
-- - Data integrity over convenience - preserve all historical data
-- - Simple, maintainable, and performant policies
-- 
-- Performance Optimizations Applied:
-- - Using (select auth.uid()) for better query caching
-- - Proper indexing should be added on user_id, client_id, trainer_id columns
-- - Avoiding complex joins where possible
-- 
-- Next Steps:
-- 1. Apply these policies in Supabase SQL Editor
-- 2. Test with different user roles
-- 3. Add database indexes for performance
-- 4. Update server actions to handle business logic
-- 5. Implement soft delete patterns where needed
-- 
-- =====================================================
-- FUTURE: AUDIT LOGGING IMPLEMENTATION
-- =====================================================
--
-- For tracking admin changes, consider implementing:
--
-- Option 1: Database Triggers (Bulletproof)
-- - Create admin_audit_log table
-- - Add triggers on tables with admin mutations
-- - Automatically log all admin INSERT/UPDATE operations
-- - Captures: admin_user_id, table_name, operation, record_id, old_values, new_values, timestamp
--
-- Option 2: Server Action Logging (Simpler)
-- - Log admin actions in Next.js server actions before database operations
-- - Store logs in dedicated audit table or external service
-- - Requires discipline but easier to implement
--
-- Recommended: Database triggers for bulletproof audit trail
-- =====================================================

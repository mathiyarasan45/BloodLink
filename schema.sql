-- ==============================================================================
-- BloodLink Phase 2 - Database Schema & Row Level Security (RLS) Policies
-- ==============================================================================

-- 1. Create the `profiles` table linked to Supabase Auth (`auth.users`)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('Donor', 'Blood Seeker', 'Hospital')),
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) on the `profiles` table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Allow users to access and mutate only their own profile data

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile during registration
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile (e.g. updating phone_verified status)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Optional: Allow public to view basic donor profiles if needed for search
-- CREATE POLICY "Public read for donor profiles"
--   ON public.profiles
--   FOR SELECT
--   USING (user_type = 'Donor');

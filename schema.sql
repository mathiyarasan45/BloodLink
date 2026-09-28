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

-- ==============================================================================
-- BloodLink Phase 3 - Blood Request System Schema & Row Level Security (RLS)
-- ==============================================================================

-- 4. Create the `blood_requests` table linked to Supabase Auth (`auth.users`)
CREATE TABLE IF NOT EXISTS public.blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blood_group TEXT NOT NULL,
  units_required INT NOT NULL CHECK (units_required > 0),
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  area TEXT NOT NULL,
  hospital_name TEXT NOT NULL,
  required_date DATE NOT NULL,
  required_time TIME NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('Emergency', 'Normal')),
  contact_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Completed', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) on the `blood_requests` table
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies:
-- Policy: Authenticated users can create their own blood requests
CREATE POLICY "Authenticated users can create own blood requests"
  ON public.blood_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Policy: Users can view their own submitted requests
CREATE POLICY "Users can view own submitted requests"
  ON public.blood_requests
  FOR SELECT
  USING (auth.uid() = requester_id);

-- Policy: Users can update their own submitted requests (e.g. status changes)
CREATE POLICY "Users can update own submitted requests"
  ON public.blood_requests
  FOR UPDATE
  USING (auth.uid() = requester_id);


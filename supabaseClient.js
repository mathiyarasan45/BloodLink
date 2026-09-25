/* ==========================================
   BloodLink - Supabase Client Module
   Phase 2 Authentication & Database Integration
   ========================================== */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Environment Variable Resolver (Supports Vite import.meta.env and runtime .env fetching)
let supabaseUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : '';
let supabaseAnonKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : '';

// Helper to fetch and parse .env file dynamically if env variables are not pre-injected
async function loadEnvConfig() {
  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-supabase-project-id')) {
    return { supabaseUrl, supabaseAnonKey };
  }

  try {
    const res = await fetch('.env');
    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').trim();
          if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value;
          if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = value;
        }
      });
    }
  } catch (e) {
    console.warn('Could not auto-load .env file:', e);
  }

  return { supabaseUrl, supabaseAnonKey };
}

let supabaseInstance = null;

export async function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  await loadEnvConfig();

  const isPlaceholderUrl = !supabaseUrl || supabaseUrl.includes('your-supabase-project-id');
  const isPlaceholderKey = !supabaseAnonKey || supabaseAnonKey.includes('your-supabase-anon-key');

  if (isPlaceholderUrl || isPlaceholderKey) {
    console.warn('Supabase credentials are not configured or using placeholders in .env');
    // Return a proxy/stub client or create dummy instance that reports configuration error on operations
    supabaseInstance = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    );
    supabaseInstance.isConfigured = false;
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  supabaseInstance.isConfigured = true;
  return supabaseInstance;
}

// Check configuration status
export function isSupabaseConfigured() {
  return supabaseInstance && supabaseInstance.isConfigured !== false && supabaseUrl && !supabaseUrl.includes('your-supabase-project-id');
}

/**
 * 1. User Registration (Email + Password) and Profile Creation
 */
export async function signUpUser({ email, password, fullName, phone, userType }) {
  const supabase = await getSupabaseClient();
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase project configuration required. Please update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.');
  }

  // Step 1: Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
        user_type: userType
      }
    }
  });

  if (authError) throw authError;

  const user = authData.user;
  if (!user) throw new Error('Registration failed. No user returned.');

  // Step 2: Insert into public.profiles table
  const { error: profileError } = await supabase.from('profiles').insert([
    {
      id: user.id,
      full_name: fullName,
      phone: phone,
      email: email,
      user_type: userType,
      phone_verified: false,
      email_verified: !!user.email_confirmed_at
    }
  ]);

  if (profileError) {
    console.warn('Profile table insertion notice:', profileError.message);
  }

  return { user, session: authData.session };
}

/**
 * 2. Real Supabase Phone OTP Request
 */
export async function sendPhoneOtp(phoneNumber) {
  const supabase = await getSupabaseClient();
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase configuration required in .env');
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phoneNumber
  });

  if (error) {
    // Provide explicit reporting if phone provider/Twilio is missing or errored
    throw new Error(`Supabase Phone OTP Error: ${error.message}. (Ensure Phone provider is enabled & configured in Supabase Dashboard -> Auth -> Providers -> Phone)`);
  }

  return data;
}

/**
 * 3. Verify Real Supabase Phone OTP
 */
export async function verifyPhoneOtp(phoneNumber, otpToken, userId) {
  const supabase = await getSupabaseClient();
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase configuration required in .env');
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneNumber,
    token: otpToken,
    type: 'sms'
  });

  if (error) {
    throw new Error(`OTP Verification Failed: ${error.message}`);
  }

  // Update phone_verified status in public.profiles table
  if (userId) {
    await supabase.from('profiles').update({ phone_verified: true }).eq('id', userId);
  }

  return data;
}

/**
 * 4. User Login (Email + Password)
 */
export async function signInUser(email, password) {
  const supabase = await getSupabaseClient();
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase project configuration required. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

/**
 * 5. User Logout
 */
export async function signOutUser() {
  const supabase = await getSupabaseClient();
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * 6. Fetch User Profile Data
 */
export async function fetchUserProfile(userId) {
  const supabase = await getSupabaseClient();
  if (!isSupabaseConfigured() || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('Could not fetch user profile:', error.message);
    return null;
  }
  return data;
}

/**
 * 7. Auth State Change Listener
 */
export async function subscribeAuthState(callback) {
  const supabase = await getSupabaseClient();
  return supabase.auth.onAuthStateChange(async (event, session) => {
    let profile = null;
    if (session?.user) {
      profile = await fetchUserProfile(session.user.id);
    }
    callback(event, session, profile);
  });
}

/**
 * 8. Get Current Session
 */
export async function getCurrentSession() {
  const supabase = await getSupabaseClient();
  if (!isSupabaseConfigured()) return { session: null, user: null, profile: null };

  const { data: { session } } = await supabase.auth.getSession();
  let profile = null;
  if (session?.user) {
    profile = await fetchUserProfile(session.user.id);
  }
  return { session, user: session?.user || null, profile };
}

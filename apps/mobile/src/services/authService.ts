import { supabase } from "./supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const OFFLINE_USER_KEY = "offline_user_id";

export async function signUp(email: string, password: string, metadata?: any) {
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: metadata
    }
  });
  if (error) throw error;
  if (data.user) {
    await AsyncStorage.setItem(OFFLINE_USER_KEY, data.user.id);
  }
}

export async function signIn(identifier: string, password: string) {
  let loginEmail = identifier;

  // Resolve identifier to email if it's not a direct email
  if (!identifier.includes("@")) {
    const { data: profile, error: usernameError } = await supabase
      .from("profiles")
      .select("email")
      .or(`username.ilike.${identifier.trim()},full_name.ilike.${identifier.trim()}`)
      .maybeSingle();

    if (usernameError || !profile?.email) {
      throw new Error("Invalid name, username or email.");
    }
    loginEmail = profile.email;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ 
    email: loginEmail.trim(), 
    password 
  });
  if (error) throw error;
  
  if (data.user) {
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("authorized")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileErr) {
      await supabase.auth.signOut();
      throw profileErr;
    }

    if (profile && profile.authorized === false) {
      await supabase.auth.signOut();
      throw new Error("Your account is pending authorization by a system administrator.");
    }

    await AsyncStorage.setItem(OFFLINE_USER_KEY, data.user.id);
  }
}

/**
 * Returns a *live* Supabase session (with a usable JWT) or null.
 *
 * This is the difference between "the app thinks you're logged in" (an
 * OFFLINE_USER_KEY in AsyncStorage) and "Supabase will actually accept your
 * writes". Inserts run as the `anon` role without a JWT and are rejected by RLS
 * (`42501`), so the sync layer must check this before attempting to flush the
 * vault. If the access token is missing/expired we try a single silent refresh.
 */
export async function getActiveSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session;
  const { data: refreshed } = await supabase.auth.refreshSession();
  return refreshed.session ?? null;
}

export async function signOut() {
  await AsyncStorage.removeItem(OFFLINE_USER_KEY);
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

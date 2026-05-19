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
    await AsyncStorage.setItem(OFFLINE_USER_KEY, data.user.id);
  }
}

export async function signOut() {
  await AsyncStorage.removeItem(OFFLINE_USER_KEY);
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

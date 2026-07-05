"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };

  const ua = "server";
  await supabase
    .from("users")
    .update({
      last_login_at: new Date().toISOString(),
      last_login_user_agent: ua,
    })
    .eq("id", data.user.id);

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role === "super_admin") {
    redirect("/platform");
  }
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete("fleet_tenant_id");
  redirect("/login");
}

export async function requestPasswordReset(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function verifyOtp(email: string, token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user!.id)
    .single();

  if (profile?.role === "super_admin") {
    redirect("/platform");
  }
  redirect("/dashboard");
}

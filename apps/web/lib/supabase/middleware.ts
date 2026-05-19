import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup");
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname === "/";

  if (!user && isDashboardPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    // Strict Admin Check for Web Dashboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (isDashboardPage && profile?.role !== 'admin') {
      // If they are logged in but not an admin, kick them to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      // Also clear their session cookie to be safe
      response.cookies.delete("sb-access-token");
      return response;
    }

    if (isAuthPage && profile?.role === 'admin') {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

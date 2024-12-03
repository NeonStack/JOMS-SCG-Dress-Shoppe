import { createClient } from "@supabase/supabase-js";
import { redirect } from "@sveltejs/kit";

export const handle = async ({ event, resolve }) => {
  event.locals.supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Access the session from a cookie
  const accessToken = event.cookies.get("sb-access-token");
  const refreshToken = event.cookies.get("sb-refresh-token");

  if (accessToken && refreshToken) {
    const {
      data: { session },
      error,
    } = await event.locals.supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    event.locals.session = session;
  } else {
    event.locals.session = null;
  }

  // Add no-cache headers for protected routes
  if (
    event.url.pathname.startsWith("/admin") ||
    event.url.pathname.startsWith("/employee")
  ) {
    event.setHeaders({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
  }

  // First check: Protected routes require authentication
  if (
    event.url.pathname.startsWith("/admin") ||
    event.url.pathname.startsWith("/employee")
  ) {
    if (!event.locals.session) {
      throw redirect(303, "/");
    }
  }

  // Only check roles if user is authenticated
  if (event.locals.session) {
    const { data: userData } = await event.locals.supabase
      .from("profiles")
      .select("role")
      .eq("id", event.locals.session.user.id)
      .single();

    event.locals.userRole = userData?.role;
    // Prevent authenticated users from accessing the login page
    if (event.url.pathname === "/") {
      if (
        event.locals.userRole === "superadmin" ||
        event.locals.userRole === "admin"
      ) {
        throw redirect(303, "/admin/dashboard");
      } else if (event.locals.userRole === "employee") {
        throw redirect(303, "/employee/dashboard");
      }
    }
    //new
    if (event.url.pathname.startsWith("/admin")) {
      if (!["superadmin", "admin"].includes(event.locals.userRole)) {
        throw redirect(303, "/employee/dashboard");
      }

      // Skip permission check for superadmin
      if (event.locals.userRole === "admin") {
        // Check permissions for admin
        const { data: permissions } = await event.locals.supabase
          .from("admin_permissions")
          .select("route_path")
          .eq("admin_id", event.locals.session.user.id);

        const allowedPaths = permissions?.map((p) => p.route_path) || [];
        const currentPath = event.url.pathname;

        // Allow access to dashboard by default
        if (
          currentPath !== "/admin/dashboard" &&
          !allowedPaths.includes(currentPath)
        ) {
          throw redirect(303, "/admin/dashboard");
        }
      }
    }

    if (event.url.pathname.startsWith("/employee")) {
      if (!["employee"].includes(event.locals.userRole)) {
        throw redirect(303, "/admin/dashboard");
      }
    }
  }

  return resolve(event);
};

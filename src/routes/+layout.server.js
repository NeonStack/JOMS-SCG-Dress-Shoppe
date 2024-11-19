import { redirect } from "@sveltejs/kit";
import { supabase } from "$lib/supabaseClient";

async function getUserRole(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw redirect(303, "/");
  }

  return data.role;
}

export const load = async ({ locals, url }) => {
  const path = url.pathname;
  
  // If user is logged in, handle their session first
  if (locals.session) {
    const role = await getUserRole(locals.session.user.id);
    
    // Add account management access control
    if (path.includes('/admin/account-management')) {
      if (role === 'employee') {
        throw redirect(303, '/employee/dashboard');
      }
    }

    // Redirect authenticated users from root/login page
    if (path === "/") {
      const dashboardPaths = {
        superadmin: "/admin/dashboard",
        admin: "/admin/dashboard",
        employee: "/employee/dashboard"
      };
      throw redirect(303, dashboardPaths[role] || "/");
    }

    // Handle role-based access restrictions
    if (path.includes("/admin") && role === "employee") {
      throw redirect(303, "/employee/dashboard");
    }

    if (path.includes("/employee") && (role === "superadmin" || role === "admin")) {
      throw redirect(303, "/admin/dashboard");
    }

    return {
      session: locals.session,
      userRole: role
    };
  }

  // Handle non-authenticated users
  if (path === "/") {
    return {
      session: null,
      userRole: null
    };
  }

  // Protect all other routes
  throw redirect(303, "/");
};

import { redirect } from "@sveltejs/kit";

export const load = async ({ locals, url }) => {
  const path = url.pathname;
  const { session, userRole } = locals;

  // If user is logged in
  if (session) {
    // Redirect from login page
    if (path === "/") {
      const dashboardPath =
        userRole === "employee" ? "/employee/dashboard" : "/admin/dashboard";
      throw redirect(303, dashboardPath);
    }

    // Handle role-based access
    if (path.includes("/admin") && userRole === "employee") {
      throw redirect(303, "/employee/dashboard");
    }

    if (path.includes("/employee") && userRole === "admin") {
      throw redirect(303, "/admin/dashboard");
    }

    return {
      session,
      userRole,
    };
  }

  // Non-authenticated users
  if (path === "/") {
    return {
      session: null,
      userRole: null,
    };
  }

  // Protect all other routes
  throw redirect(303, "/");
};

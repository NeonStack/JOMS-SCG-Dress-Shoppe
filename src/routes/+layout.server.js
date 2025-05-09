export const load = async ({ locals }) => {
  let permissions = [];
  let userProfile = null;

  if (locals.session) {
    // Get user profile data
    const { data: profileData } = await locals.supabase
      .from("profiles")
      .select("*")
      .eq("id", locals.session.user.id)
      .single();
    
    userProfile = profileData;

    // Get permissions for admin users
    if (locals.userRole === "admin") {
      const { data } = await locals.supabase
        .from("admin_permissions")
        .select("route_path")
        .eq("admin_id", locals.session.user.id);

      permissions = data?.map((p) => p.route_path) || [];
    }
  }
  
  return {
    session: locals.session,
    userRole: locals.userRole,
    permissions,
    userProfile
  };
};

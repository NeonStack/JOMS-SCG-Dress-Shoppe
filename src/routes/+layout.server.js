export const load = async ({ locals }) => {
  let permissions = [];

  if (locals.userRole === "admin" && locals.session) {
    const { data } = await locals.supabase
      .from("admin_permissions")
      .select("route_path")
      .eq("admin_id", locals.session.user.id);

    permissions = data?.map((p) => p.route_path) || [];
  }
  return {
    session: locals.session,
    userRole: locals.userRole,
    permissions,
  };
};

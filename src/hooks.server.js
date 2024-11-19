import { supabase } from '$lib/supabaseClient';

export const handle = async ({ event, resolve }) => {
  event.locals.supabase = supabase;

  // Get the session
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user?.id) {
    // Always fetch the current user role with the session
    const { data: userData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userData?.role) {
      // Attach the role to the session
      session.user.role = userData.role;
    }

    if (session?.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000;

      if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
        const { data } = await supabase.auth.refreshSession();
        if (data?.session) {
          // Ensure the role persists after refresh
          data.session.user.role = userData?.role;
          event.locals.session = data.session;
        }
      } else {
        event.locals.session = session;
      }
    }
  } else {
    event.locals.session = null;
  }

  return resolve(event);
};

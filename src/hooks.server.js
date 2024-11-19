import { supabase } from '$lib/supabaseClient';

export const handle = async ({ event, resolve }) => {
  event.locals.supabase = supabase;

  // Get the session
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.expires_at) {
    // Check if token is close to expiring (within 5 minutes)
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
      const { data } = await supabase.auth.refreshSession();
      event.locals.session = data.session;
    } else {
      event.locals.session = session;
    }
  } else {
    event.locals.session = null;
  }

  return resolve(event);
};
